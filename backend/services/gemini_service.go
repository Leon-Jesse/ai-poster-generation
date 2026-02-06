package services

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"google.golang.org/genai"

	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/utils"
	"go.uber.org/zap"
)

const (
	baseSystemPrompt = `You are an expert YouTube Thumbnail designer specializing in the "MrBeast / Viral High-CTR" aesthetic.
Your goal is MAXIMUM VISUAL IMPACT with a GLOSSY, HIGH-CONTRAST finish.

CORE RULES for AESTHETICS:
1. **BACKGROUND STYLE**: **"Immersive 3D Environment"**.
   - **REALISTIC SETS**: The background MUST be a high-quality 3D render or photo-bash of a real environment related to the topic.
   - **NO ABSTRACT SHAPES**: DO NOT use random geometric lines, blobs, or abstract patterns.
   - **DEPTH**: Use strong Blur/Bokeh to push the background back.
   - **BOLD COLORS**: Use rich, saturated colors derived from the context.
   - **COMPOSITION**: **FULL BLEED.** ABSOLUTELY NO BORDERS.
2. **SUBJECT SEPARATION**:
   - **NO WHITE OUTLINES**: Do not put a white stroke around the person.
   - **NATURAL SEPARATION**: Use Depth of Field and Environmental Backlighting to separate the subject naturally.
3. **"BEST SELF" FACE**:
   - **SKIN**: Radiant, healthy, natural texture. No over-smoothing.
   - **HAIR**: **STRICTLY PRESERVE LENGTH.** Style it nicely, but do not change the cut.
4. **TEXT**: Large, Bold, Sans-Serif. Pure White with a sharp Drop Shadow.`
)

var styleDirections = []struct {
	Name        string
	Instruction string
}{
	{
		Name:        "Viral Pop",
		Instruction: "Analyze the topic and pick the 2 most vibrant complementary colors. High saturation and gloss.",
	},
	{
		Name:        "Cinematic Drama",
		Instruction: "Dramatic studio lighting, deep shadows, and high-energy atmospheric effects.",
	},
	{
		Name:        "Luxury Prestige",
		Instruction: "Glossy, polished textures with reflective highlights and a clean, powerful composition.",
	},
}

type GeminiService struct {
	client *genai.Client
	apiKey string
}

type GenerateRequest struct {
	ContextPrompt   string  // 背景场景描述
	OverlayText     string  // 封面大字
	Emotion         string  // 表情
	AspectRatio     string  // 16:9, 3:4, 9:16, 4:3
	SelfieBase64    *string // 用户照片 base64 (可选)
	DesignRefBase64 *string // 风格参考图 base64 (可选)
	AdvancedStyle   *string // 自定义风格指令 (可选)
}

type GeneratedResult struct {
	ImageData string `json:"image_data"` // base64 encoded image data
	Style     string `json:"style"`      // style name
	URL       string `json:"url"`        // data URL format: data:image/png;base64,{ImageData}
}

func NewGeminiService() (*GeminiService, error) {
	apiKey := config.AppConfig.GeminiAPIKey
	if apiKey == "" {
		return nil, errors.New("GEMINI_API_KEY not configured")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &GeminiService{
		client: client,
		apiKey: apiKey,
	}, nil
}

// GenerateBeastThumbnails generates multiple thumbnails with different styles
func (s *GeminiService) GenerateBeastThumbnails(req GenerateRequest) ([]GeneratedResult, error) {
	if s.client == nil {
		return nil, errors.New("Gemini client not initialized")
	}

	// Normalize aspect ratio
	aspectRatio := normalizeAspectRatio(req.AspectRatio)

	// Generate thumbnails for each style
	results := make([]GeneratedResult, 0, len(styleDirections))
	ctx := context.Background()

	for _, style := range styleDirections {
		result, err := s.generateSingleThumbnail(ctx, req, style.Name, style.Instruction, aspectRatio)
		if err != nil {
			utils.Logger.Error("Failed to generate thumbnail", zap.String("style", style.Name), zap.Error(err))
			continue
		}
		if result != nil {
			results = append(results, *result)
		}
	}

	if len(results) == 0 {
		return nil, errors.New("all thumbnail generation attempts failed")
	}

	return results, nil
}

func (s *GeminiService) generateSingleThumbnail(
	ctx context.Context,
	req GenerateRequest,
	styleName, styleInstruction, aspectRatio string,
) (*GeneratedResult, error) {
	parts := []*genai.Part{}

	// Add selfie image if provided
	if req.SelfieBase64 != nil && *req.SelfieBase64 != "" {
		imgData, err := base64ToImageData(*req.SelfieBase64)
		if err != nil {
			utils.Logger.Warn("Failed to decode selfie base64", zap.Error(err))
		} else {
			parts = append(parts, &genai.Part{
				InlineData: &genai.Blob{
					MIMEType: "image/png",
					Data:     imgData,
				},
			})
		}
	}

	// Add design reference image if provided
	if req.DesignRefBase64 != nil && *req.DesignRefBase64 != "" {
		imgData, err := base64ToImageData(*req.DesignRefBase64)
		if err != nil {
			utils.Logger.Warn("Failed to decode design ref base64", zap.Error(err))
		} else {
			parts = append(parts, &genai.Part{
				InlineData: &genai.Blob{
					MIMEType: "image/png",
					Data:     imgData,
				},
			})
		}
	}

	// Build layout instruction
	layoutInstruction := ""
	if aspectRatio == "3:4" || aspectRatio == "9:16" {
		layoutInstruction = "LAYOUT: Vertical Portrait. Subject fills most of the frame. Text at top."
	} else if aspectRatio == "4:3" {
		layoutInstruction = fmt.Sprintf("LAYOUT: Horizontal %s (Classic). Subject on one side, Text on other. Large subject. Full Bleed.", aspectRatio)
	} else {
		layoutInstruction = fmt.Sprintf("LAYOUT: Horizontal %s. Subject on one side, Text on other. Large subject. Full Bleed.", aspectRatio)
	}

	// Build user instruction
	userInstruction := fmt.Sprintf(`%s

TASK: Create a %s YouTube thumbnail.

DETAILS:
- **Topic**: "%s"
- **Text Overlay**: "%s"
- **Desired Emotion**: "%s"
- **Style Directive**: %s
- **Aspect Ratio**: %s
%s

CONSTRAINTS:
1. %s
2. **IMAGE 1 (if provided)**: This is the SUBJECT FACE. Preserve the face and hair length exactly. Apply emotion: %s.
3. **IMAGE 2 (if provided)**: This is the DESIGN REFERENCE. Use its composition, color balance, and lighting style as inspiration, but apply it to the Topic: "%s".
4. **NO ABSTRACT SHAPES**: Use a realistic 3D set or environment.
5. **NO OUTLINES**: Use lighting and blur for separation.
6. **COLORS**: Glossy, bold, high-contrast, dual-tone.`,
		baseSystemPrompt,
		styleName,
		req.ContextPrompt,
		req.OverlayText,
		req.Emotion,
		styleInstruction,
		aspectRatio,
		func() string {
			if req.AdvancedStyle != nil && *req.AdvancedStyle != "" {
				return fmt.Sprintf("- **Custom Style Overrides**: \"%s\"", *req.AdvancedStyle)
			}
			return ""
		}(),
		layoutInstruction,
		req.Emotion,
		req.ContextPrompt,
	)

	parts = append(parts, genai.NewPartFromText(userInstruction))

	contents := []*genai.Content{
		genai.NewContentFromParts(parts, genai.RoleUser),
	}

	// Generate content using gemini-2.5-flash-image or gemini-3-pro-image-preview
	// Note: Check available models - gemini-3-pro-image-preview might not be available in genai SDK yet
	modelName := "gemini-2.5-flash-image"
	result, err := s.client.Models.GenerateContent(ctx, modelName, contents, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || len(result.Candidates) == 0 {
		return nil, errors.New("no candidates returned from API")
	}

	// Extract image from response
	for _, part := range result.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			imageData := base64.StdEncoding.EncodeToString(part.InlineData.Data)
			return &GeneratedResult{
				ImageData: imageData,
				Style:     styleName,
				URL:       fmt.Sprintf("data:image/png;base64,%s", imageData),
			}, nil
		}
	}

	return nil, errors.New("no image data found in response")
}

// normalizeAspectRatio normalizes aspect ratio string
func normalizeAspectRatio(ratio string) string {
	ratio = strings.TrimSpace(ratio)
	switch ratio {
	case "16:9", "16/9":
		return "16:9"
	case "3:4", "3/4":
		return "3:4"
	case "9:16", "9/16":
		return "9:16"
	case "4:3", "4/3":
		return "4:3"
	default:
		return "16:9" // default
	}
}

// base64ToImageData converts base64 string (with or without data URL prefix) to image bytes
func base64ToImageData(base64Str string) ([]byte, error) {
	// Remove data URL prefix if present
	if idx := strings.Index(base64Str, ","); idx != -1 {
		base64Str = base64Str[idx+1:]
	}
	return base64.StdEncoding.DecodeString(base64Str)
}
