import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Paperclip } from 'lucide-react';
import { sanitizePlainText } from '@/lib/sanitize';

const feedbackSchema = z.object({
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachmentFile(file);
    }
  };

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      let attachmentPath: string | null = null;

      // Upload attachment if exists
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${attachmentFile.name}`;


        const { error: uploadError } = await supabase.storage
          .from('attachment-feedback')
          .upload(fileName, attachmentFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without attachment if upload fails
        } else {
          attachmentPath = fileName;
        }
      }

      // Insert feedback
      const safeSubject = sanitizePlainText(data.subject.trim());
      const safeMessage = sanitizePlainText(data.message.trim());
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        subject: safeSubject,
        message: safeMessage,
        attachment_path: attachmentPath,
      });

      if (error) throw error;

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We appreciate your input.',
      });

      // Reset form
      form.reset();
      setAttachmentFile(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-muted-foreground">
          Help us improve by sharing your thoughts, suggestions, or reporting issues.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit Feedback
            </CardTitle>
            <CardDescription>
              Your feedback helps us make the platform better for everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bug">Bug Report</SelectItem>
                          <SelectItem value="Feature Request">Feature Request</SelectItem>
                          <SelectItem value="General">General Feedback</SelectItem>
                          <SelectItem value="Question">Question</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your feedback in detail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="cursor-pointer"
                    />
                  </div>
                  {attachmentFile && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {attachmentFile.name}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Bug Reports</h4>
              <p className="text-sm text-muted-foreground">
                Include steps to reproduce the issue, expected behavior, and any error messages.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Feature Requests</h4>
              <p className="text-sm text-muted-foreground">
                Describe the feature you'd like to see and how it would help your workflow.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm">General Feedback</h4>
              <p className="text-sm text-muted-foreground">
                Share your thoughts on existing features, usability, or overall experience.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Response Time</h4>
              <p className="text-sm text-muted-foreground">
                We review all feedback regularly. Critical issues are prioritized.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FeedbackPage;
