import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Music, Eye, EyeOff, Loader2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface SettingsFormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  spotifyUsername: string;
  spotifyPassword: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    spotify: false
  });
  
  const [formData, setFormData] = useState<SettingsFormData>({
    email: (user as any)?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    spotifyUsername: "",
    spotifyPassword: ""
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<SettingsFormData>) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        spotifyPassword: ""
      }));
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateEmail = async () => {
    if (!formData.email || !formData.currentPassword) {
      toast({
        title: "Missing Information",
        description: "Email and current password are required",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      email: formData.email,
      currentPassword: formData.currentPassword
    });
  };

  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
  };

  const handleUpdateSpotify = async () => {
    updateProfileMutation.mutate({
      spotifyUsername: formData.spotifyUsername,
      spotifyPassword: formData.spotifyPassword
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-300">Manage your account preferences and integrations</p>
        </div>

        {/* Email Settings */}
        <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <User className="h-5 w-5" />
              <span>Email Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={updateProfileMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password-email" className="text-gray-200">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password-email"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white pr-10"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleUpdateEmail}
              disabled={updateProfileMutation.isPending || !formData.email || !formData.currentPassword}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Lock className="h-5 w-5" />
              <span>Password Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-gray-200">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white pr-10"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-200">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white pr-10"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-200">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white pr-10"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleUpdatePassword}
              disabled={updateProfileMutation.isPending || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Spotify Integration */}
        <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Music className="h-5 w-5" />
              <span>Spotify Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Add or update your Spotify credentials for seamless playlist exports
            </p>
            <div className="space-y-2">
              <Label htmlFor="spotify-username" className="text-gray-200">Spotify Username/Email</Label>
              <Input
                id="spotify-username"
                value={formData.spotifyUsername}
                onChange={(e) => setFormData(prev => ({ ...prev, spotifyUsername: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
                placeholder="Your Spotify username or email"
                disabled={updateProfileMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotify-password" className="text-gray-200">Spotify Password</Label>
              <div className="relative">
                <Input
                  id="spotify-password"
                  type={showPasswords.spotify ? "text" : "password"}
                  value={formData.spotifyPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, spotifyPassword: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white pr-10"
                  placeholder="Your Spotify password"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, spotify: !prev.spotify }))}
                >
                  {showPasswords.spotify ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleUpdateSpotify}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Spotify Credentials
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}