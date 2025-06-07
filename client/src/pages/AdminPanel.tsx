import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link, Redirect } from "wouter";

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  spotifyConnected?: string;
}

export default function AdminPanel() {
  const { user } = useAuth();

  // Redirect if not admin
  if ((user as any)?.email !== 'gkraem@vt.edu') {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-300">Manage users and system settings</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Users className="h-5 w-5" />
              <span>Active Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading users...</div>
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Joined</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Spotify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.firstName 
                                  ? user.firstName
                                  : user.email.split('@')[0]
                                }
                              </div>
                              <div className="text-xs text-gray-500">ID: {user.id.substring(0, 20)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {user.spotifyConnected ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-400 border border-green-700/50">
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-900/20 text-gray-400 border border-gray-700/50">
                              Not connected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">No users found</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{users?.length || 0}</div>
                  <div className="text-sm text-gray-400">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {users?.filter(u => u.spotifyConnected).length || 0}
                  </div>
                  <div className="text-sm text-gray-400">Spotify Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">%</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {users?.length ? Math.round((users.filter(u => u.spotifyConnected).length / users.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-400">Connection Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}