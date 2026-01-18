-- Create knowledge_files table for storing uploaded knowledge
CREATE TABLE public.knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Anyone can view knowledge files
CREATE POLICY "Knowledge files are viewable by everyone" 
ON public.knowledge_files 
FOR SELECT 
USING (true);

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload knowledge files" 
ON public.knowledge_files 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own files
CREATE POLICY "Users can update their own knowledge files" 
ON public.knowledge_files 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own knowledge files" 
ON public.knowledge_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_knowledge_files_updated_at
BEFORE UPDATE ON public.knowledge_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge', 'knowledge', true);

-- Storage policies
CREATE POLICY "Knowledge files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'knowledge');

CREATE POLICY "Authenticated users can upload knowledge files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own knowledge files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);