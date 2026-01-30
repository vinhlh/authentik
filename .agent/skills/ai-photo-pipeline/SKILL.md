---
name: AI Photo Pipeline
description: Use your own Vision and Image Generation capabilities to select and enhance restaurant photos.
---

# AI Photo Pipeline Skill

This skill allows you to process restaurant photos using your internal multimodal capabilities, bypassing external API limits.

## Workflow

1.  **Locate Candidates**:
    *   List files in `src/authentik/images/<collection_slug>/*.jpg`.
    *   Look for patterns like `*-candidate-*.jpg`.

2.  **Analyze & Select**:
    *   For each candidate photo, **view** it (using `view_file` or by context).
    *   Analyze it for:
        *   **Food Appeal**: Is it delicious?
        *   **Quality**: Is it focused and well-lit?
        *   **Content**: Is it food (priority) or interior/exterior?
    *   Select the top **3** best food photos.

3.  **Enhance**:
    *   For the selected 3 photos, use your `generate_image` tool.
    *   **Prompt**: "Enhance the lighting and color of this food photo to make it look like a high-end food delivery app studio shot. STRICTLY PRESERVE the food content, ingredients, and arrangement. Do NOT add, remove, or change any food items. Do NOT hallucinate new garnishes. Your goal is 'Relighting' and 'Color Grading' only. Make it vibrant and appetizing, but keep the geometry 100% identical to the original."
    *   **Input**: Pass the original candidate image path in `image_paths`.
    *   **Output**: Save as `<short_id>-enhanced-<index>.jpg` in the same directory.

4.  **Report**:
    *   Summarize which photos were selected and why.
