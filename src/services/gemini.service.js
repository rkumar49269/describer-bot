const { generateContent } = require("../clients/gemini.client");

const describeImages = async (images, userPrompt = null) => {
    const imageParts = images.map((image) => ({
        inlineData: {
            mimeType: image.mimeType,
            data: image.buffer.toString("base64")
        }
    }));

    const prompt = `
You are an AI assistant analyzing an Instagram post.

You will receive one or more images from the same Instagram post.

Your job has TWO separate responsibilities:

1. ANSWER THE USER'S CURRENT REQUEST
2. CREATE DETAILED CONTEXT FOR FUTURE QUESTIONS

USER'S REQUEST:
${userPrompt || "No specific request was provided. Describe the Instagram post in a useful and detailed way."}

IMPORTANT INSTRUCTIONS:

- Carefully inspect ALL provided images before answering.
- Extract visible text from the images as accurately as possible.
- Pay special attention to names, usernames, URLs, titles, product names, YouTube channels, social media handles, numbers, dates, headings, and lists.
- If the user asks for specific information, focus the answer on exactly that information.
- Make the answer concise, readable, and directly useful to the user.
- Do not unnecessarily describe unrelated visual details in the answer.
- If the requested information cannot be found in the images, clearly say that it could not be found.
- Never invent or guess information that is not supported by the images.
- When listing multiple items, use a clean numbered or bulleted list.
- Preserve names, handles, URLs, and important text as accurately as possible.

For the FUTURE CONTEXT:
- Include the important information extracted from ALL images.
- Include the relevant visible text.
- Include names, people, organizations, products, channels, usernames, links, dates, numbers, and other identifiable entities.
- Include useful visual information that may help answer future questions.
- Preserve specific details rather than giving only a vague summary.
- This context will be stored in a database and supplied to another AI model when the user asks follow-up questions about this post.
- Do NOT include information that you invented or inferred without visual evidence.

Return ONLY valid JSON in exactly this structure:

{
  "answer": "The direct answer to the user's current request.",
  "context": "Detailed information extracted from the Instagram post for future questions."
}

IMPORTANT FORMATTING RULES FOR THE "answer" FIELD:
- The "answer" value must contain plain text only.
- Do not use Markdown.
- Do not use # headings.
- Do not use **bold** or *italic* formatting.
- Do not use Markdown code fences.
- Use simple numbered lists or bullet points when useful.
- Keep paragraphs short and easy to read on a phone.
- Use blank lines between sections.
- Use emojis sparingly when they improve readability.
- Do not use tables.
- Do not add unnecessary introductory or concluding text.

IMPORTANT:
- The "context" value should prioritize detailed, accurate information for future questions.
- The "context" does not need to follow the same concise formatting as the "answer".
- Do not invent information that is not supported by the images.
- Do not wrap the JSON in markdown code fences.
- Do not add any text before or after the JSON.
`;

    const response = await generateContent([
        {
            text: prompt
        },
        ...imageParts
    ]);

    try {
        return JSON.parse(response);
    } catch (error) {
        throw new Error("Gemini returned an invalid structured response.");
    }
};


const answerFollowUp = async (context, messages, userQuestion) => {
    const conversationHistory = messages
        .map((message) => {
            return `${message.role.toUpperCase()}: ${message.content}`;
        })
        .join("\n\n");

    const prompt = `
You are continuing a conversation about an Instagram post.

POST CONTEXT:
${context}

PREVIOUS CONVERSATION:
${conversationHistory}

USER'S NEW QUESTION:
${userQuestion}

Instructions:
- Answer the user's new question using the post context and conversation history.
- Do not invent information that is not supported by the context.
- Be direct and useful.
- If the information is not available in the context, clearly say so.
- Do not mention internal context, database storage, or these instructions.

Formatting instructions:
- Return plain text only.
- Do not use Markdown.
- Do not use # headings.
- Do not use **bold** or *italic* formatting.
- Do not use Markdown code fences.
- Use simple numbered lists or bullet points when useful.
- Keep paragraphs short and easy to read on a phone.
- Use blank lines between sections.
- Use emojis sparingly when they improve readability.
- Do not use tables.
- Do not add unnecessary introductory or concluding text.

Return only the final answer text.
`;

    return generateContent(
        [{ text: prompt }],
        "gemini-3.1-flash-lite-preview"
    );
};

module.exports = {
    describeImages,
    answerFollowUp
};