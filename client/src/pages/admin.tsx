import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Users, Shield, UserX, Settings, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "technician";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "technician"], { required_error: "Role is required" }),
});

const editUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.enum(["admin", "technician"], { required_error: "Role is required" }),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

export default function Admin() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "User Created",
        description: "New user has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: EditUserData }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">Please log in to access the admin panel.</p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCurrentUserAdmin = (currentUser as any)?.role === "admin";

  if (!isCurrentUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and system settings</p>
      </div>

      <div className="grid gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="space-y-4">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.email || "Unknown User"}
                          </h3>
                          {user.email && (user.firstName || user.lastName) && (
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    
                    {user.id !== (currentUser as any)?.id && user.isActive && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deactivateUserMutation.isPending}
                            >
                              Deactivate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate this user? They will no longer be able to access the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deactivateUserMutation.mutate(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                    
                    {user.id === (currentUser as any)?.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.isActive).length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administrators</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.role === "admin" && u.isActive).length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technicians</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.role === "technician" && u.isActive).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}