import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Feedback } from '@/lib/supabase-types';

export function AdminFeedbackPage() {
  const { data: feedback, refetch, isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const feedbackWithProfiles = await Promise.all(
        (data || []).map(async (item) => {
          if (item.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('user_id', item.user_id)
              .single();
            return { ...item, profile };
          }
          return { ...item, profile: null };
        })
      );
      
      return feedbackWithProfiles;
    },
  });

  const openAttachment = async (path: string) => {
  const { data, error } = await supabase.storage
    .from('attachment-feedback')   // ✅ correct bucket
    .createSignedUrl(path, 60 * 5); // 5 minutes

  if (error) {
    console.error(error);
    return;
  }

  window.open(data.signedUrl, '_blank');
};


  const getSubjectBadge = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'bug':
        return <Badge variant="destructive">Bug</Badge>;
      case 'feature request':
        return <Badge className="bg-accent text-accent-foreground">Feature</Badge>;
      default:
        return <Badge variant="secondary">{subject}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Feedback</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Attachment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : feedback?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No feedback submitted yet
                  </TableCell>
                </TableRow>
              ) : (
                feedback?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {item.profile?.full_name || item.profile?.username || 'Unknown'}
                    </TableCell>
                    <TableCell>{getSubjectBadge(item.subject)}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{item.message}</p>
                    </TableCell>
                    <TableCell>
                      {item.attachment_path ? (
                        <Button
                        variant="link"
                        size="sm"
                        onClick={() => openAttachment(item.attachment_path)}
                        >
                           View 
                           </Button>

                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminFeedbackPage;
