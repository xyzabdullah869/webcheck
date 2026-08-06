/*
# Fix AI prompt templates variables column type

The variables column was created as jsonb but needs to be text[] for the application.
We drop and recreate the column since the table is new and has no user data yet.
Also inserts default prompt templates.
*/

-- Drop and recreate the variables column as text[]
ALTER TABLE ai_prompt_templates DROP COLUMN IF EXISTS variables;
ALTER TABLE ai_prompt_templates ADD COLUMN variables text[] NOT NULL DEFAULT '{}';

-- Insert default prompt templates
INSERT INTO ai_prompt_templates (name, template_key, description, prompt_text, variables) VALUES
('Teach Topic', 'teach_topic', 'Used when the AI teacher explains a new topic', 'You are a professional AI teacher. Teach the topic: {topic}. Use the following course content as your knowledge base: {context}. Teaching mode: {teaching_mode}. Language: {language}. Explain naturally with examples and real-life scenarios. Do NOT just read the text — teach like a human instructor.', ARRAY['topic','context','teaching_mode','language']),
('Handle Interruption', 'handle_interruption', 'Used when a student interrupts', 'A student asked: {question}. Current topic: {topic}. Recent content: {recent_content}. Answer concisely and helpfully. Language: {language}.', ARRAY['question','topic','recent_content','language']),
('Generate Quiz', 'generate_quiz', 'Used to create quiz questions', 'Generate {num_questions} quiz questions about: {topic}. Context: {context}. Difficulty: {difficulty}. Return JSON array with question, options (4), correctIndex (0-3), and explanation.', ARRAY['num_questions','topic','context','difficulty']),
('Generate Homework', 'generate_homework', 'Used to create homework', 'Generate homework of type: {homework_type}. Topic: {topic}. Context: {context}. Difficulty: {difficulty}. Return structured JSON.', ARRAY['homework_type','topic','context','difficulty']),
('Generate Summary', 'generate_summary', 'Used to create lesson summaries', 'Create a comprehensive lesson summary for: {topic}. Context: {context}. Include summary, keyPoints (array), definitions (array of {term, definition}), formulas (array), revisionNotes, homeworkRecommendation, and nextLessonPreparation. Return JSON.', ARRAY['topic','context']),
('Chat With Context', 'chat_with_context', 'General student questions', 'Answer the student question: {question}. Topic context: {topic}. Course content: {context}. Language: {language}. If the answer is not in the course content, say so clearly.', ARRAY['question','topic','context','language'])
ON CONFLICT (template_key) DO NOTHING;

-- Ensure default settings rows exist
INSERT INTO ai_settings (provider, api_model) SELECT 'openai', 'gpt-4o-mini'
  WHERE NOT EXISTS (SELECT 1 FROM ai_settings);
INSERT INTO ai_voice_settings (default_voice) SELECT 'female'
  WHERE NOT EXISTS (SELECT 1 FROM ai_voice_settings);
