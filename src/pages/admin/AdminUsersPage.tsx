import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, UserPlus, MoreHorizontal, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function AdminUsersPage() {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [selectedDisableUserId, setSelectedDisableUserId] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    role: "user" as "admin" | "user" | "manager",
  });

  const queryClient = useQueryClient();

  const { data: users, refetch, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .single();
          return { ...profile, user_role: roleData?.role || 'user' };
        })
      );
      
      return profilesWithRoles;
    },
  });

  const invokeEdgeFunction = async (functionName: string, body: any) => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw new Error(error.message || `Edge function error`);
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || `Failed to invoke ${functionName}`);
    }
  };

  // ------------------- UPDATE ROLE -------------------
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUserId(null);
      alert('Role updated successfully');
    },
    onError: (error) => {
      alert('Failed to update role: ' + error.message);
    },
  });

  // ------------------- UPDATE PASSWORD -------------------
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      await invokeEdgeFunction('update-user-password', { userId, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setPasswordModalOpen(false);
      setNewPassword("");
      setSelectedUserId(null);
      alert("Password updated successfully");
    },
    onError: (error) => {
      alert("Failed to update password: " + error.message);
    },
  });

  // ------------------- DISABLE ACCOUNT -------------------
  const disableAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      await invokeEdgeFunction('disable-user-account', { userId, disabled: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDisableModalOpen(false);
      setSelectedDisableUserId(null);
      alert("Account disabled successfully");
    },
    onError: (error) => {
      alert("Failed to disable account: " + error.message);
    },
  });

  // ------------------- ENABLE ACCOUNT -------------------
  const enableAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      await invokeEdgeFunction('disable-user-account', { userId, disabled: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert("Account enabled successfully");
    },
    onError: (error) => {
      alert("Failed to enable account: " + error.message);
    },
  });

  // ------------------- CREATE NEW USER -------------------
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!newUserData.email || !newUserData.password) {
        throw new Error("Email and password are required");
      }

      await invokeEdgeFunction('create-user', {
        email: newUserData.email,
        password: newUserData.password,
        full_name: newUserData.full_name,
        username: newUserData.username || newUserData.email.split("@")[0],
        role: newUserData.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddUserOpen(false);
      setNewUserData({
        email: "",
        password: "",
        full_name: "",
        username: "",
        role: "user",
      });
      alert("User created successfully");
    },
    onError: (error) => {
      alert("Failed to create user: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              {/* <Button size="sm" className="bg-accent hover:bg-accent/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={newUserData.full_name}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={newUserData.username}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, username: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserData.role} onValueChange={(role: any) =>
                    setNewUserData({ ...newUserData, role })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createUserMutation.mutate()}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || user.username || '-'}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {editingUserId === user.user_id ? (
                        <div className="flex gap-2">
                          <Select value={editingRole} onValueChange={setEditingRole}>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              updateRoleMutation.mutate({
                                userId: user.user_id,
                                role: editingRole,
                              });
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUserId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={user.user_role === 'admin' ? 'default' : 'secondary'}>
                          {user.user_role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUserId(user.user_id);
                              setEditingRole(user.user_role);
                            }}
                          >
                            Edit Role
                          </DropdownMenuItem>

                          <Dialog open={passwordModalOpen && selectedUserId === user.user_id} onOpenChange={(open) => {
                            if (!open) {
                              setPasswordModalOpen(false);
                              setSelectedUserId(null);
                              setNewPassword("");
                            }
                          }}>
                            {/* <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setPasswordModalOpen(true);
                                  setSelectedUserId(user.user_id);
                                }}
                              >
                                Reset Password
                              </DropdownMenuItem>
                            </DialogTrigger> */}
                            {/* <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                  Enter a new password for {user.username}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="new-password">New Password</Label>
                                  <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() =>
                                    updatePasswordMutation.mutate({
                                      userId: user.user_id,
                                      password: newPassword,
                                    })
                                  }
                                  disabled={updatePasswordMutation.isPending || !newPassword}
                                >
                                  {updatePasswordMutation.isPending
                                    ? "Updating..."
                                    : "Update Password"}
                                </Button>
                              </div>
                            </DialogContent> */}
                          </Dialog>

                          <Dialog open={disableModalOpen && selectedDisableUserId === user.user_id} onOpenChange={(open) => {
                            if (!open) {
                              setDisableModalOpen(false);
                              setSelectedDisableUserId(null);
                            }
                          }}>
                            {/* <DialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDisableModalOpen(true);
                                  setSelectedDisableUserId(user.user_id);
                                }}
                              >
                                Disable Account
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Disable Account</DialogTitle>
                              </DialogHeader>
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  This will disable the account and prevent the user from logging in.
                                </AlertDescription>
                              </Alert>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setDisableModalOpen(false);
                                    setSelectedDisableUserId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    disableAccountMutation.mutate(user.user_id);
                                  }}
                                  disabled={disableAccountMutation.isPending}
                                >
                                  {disableAccountMutation.isPending
                                    ? "Disabling..."
                                    : "Disable Account"}
                                </Button>
                              </div>
                            </DialogContent> */}
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

export default AdminUsersPage;
