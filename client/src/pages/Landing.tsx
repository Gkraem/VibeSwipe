import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Sparkles, Heart, Shuffle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
              <Music className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vibe Swipe</h1>
              <p className="text-sm text-gray-400">AI Playlist Generator</p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Create Perfect Playlists with AI
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Tell us your vibe, swipe through AI-curated songs, and generate the perfect playlist for any mood, activity, or moment.
          </p>
          
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <Sparkles className="mr-2" />
            Start Creating Playlists
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">AI-Powered Curation</h3>
              <p className="text-gray-400">
                Describe your perfect playlist in natural language. Our AI understands context, mood, and musical preferences.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Swipe to Discover</h3>
              <p className="text-gray-400">
                Engage with music like never before. Swipe right to love, left to skip. Every swipe teaches our AI your taste.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shuffle className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Perfect Playlists</h3>
              <p className="text-gray-400">
                Generate curated playlists from your selections. Export to Spotify or Apple Music when ready.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Section */}
      <div className="container mx-auto px-4 py-16 bg-gray-800/30">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4 text-white">How It Works</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three simple steps to your perfect playlist
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h4 className="text-lg font-bold mb-2 text-white">Describe Your Vibe</h4>
            <p className="text-gray-400">Tell our AI what you're looking for: "upbeat songs for working out" or "chill indie for studying"</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h4 className="text-lg font-bold mb-2 text-white">Swipe Through Songs</h4>
            <p className="text-gray-400">Our AI presents curated suggestions. Swipe right to add to your playlist, left to skip.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h4 className="text-lg font-bold mb-2 text-white">Generate & Export</h4>
            <p className="text-gray-400">Create your final playlist and export it to your favorite music streaming platform.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-4 text-white">Ready to Discover Your Next Favorite Song?</h3>
        <p className="text-gray-400 mb-8">Join thousands of music lovers creating perfect playlists with AI.</p>
        <Button 
          onClick={handleLogin}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          Get Started Free
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center text-gray-400">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5" />
              <span>© 2024 Vibe Swipe. Powered by AI.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
