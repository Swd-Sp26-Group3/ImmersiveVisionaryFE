'use client';
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";
import { Sparkles, Wand2, Image, Box, Palette, Layers, Download, RefreshCw, Settings, Zap } from "lucide-react";

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [quality, setQuality] = useState([75]);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedImages([
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop",
      ]);
      setIsGenerating(false);
    }, 3000);
  };

  const styles = [
    { id: "realistic", name: "Realistic", icon: <Image className="w-4 h-4" /> },
    { id: "minimalist", name: "Minimalist", icon: <Palette className="w-4 h-4" /> },
    { id: "futuristic", name: "Futuristic", icon: <Zap className="w-4 h-4" /> },
    { id: "artistic", name: "Artistic", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const presetPrompts = [
    "Black smartphone with curved display and multi-lens camera",
    "Modern wireless headphones with RGB LED lights",
    "Gaming chair with ergonomic design in black and red",
    "Smartwatch with round face and metal band",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">AI-Powered Generation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Generate 3D Products with AI
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Use advanced AI technology to create product images and 3D models from text descriptions
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prompt Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Product Description
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Describe the product you want to create in detail
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-white">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., A premium smartphone with titanium frame, curved OLED display, triple vertical camera array..."
                      rows={6}
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Quick suggestions:</Label>
                    <div className="space-y-2">
                      {presetPrompts.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(preset)}
                          className="w-full text-left text-xs p-2 rounded bg-[#0f1729] border border-purple-500/20 text-gray-300 hover:border-indigo-500/50 hover:text-white transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Style Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedStyle === style.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-purple-500/20 hover:border-purple-500/40"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`${selectedStyle === style.id ? "text-indigo-400" : "text-gray-400"}`}>
                            {style.icon}
                          </div>
                          <span className={`text-xs font-medium ${selectedStyle === style.id ? "text-white" : "text-gray-400"}`}>
                            {style.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Advanced Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="quality" className="text-white">
                      Quality: {quality[0]}%
                    </Label>
                    <Slider
                      id="quality"
                      value={quality}
                      onValueChange={setQuality}
                      min={25}
                      max={100}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Fast</span>
                      <span>Quality</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="output-format" className="text-white">Output Format</Label>
                    <Select defaultValue="png">
                      <SelectTrigger id="output-format" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="png">PNG (Image)</SelectItem>
                        <SelectItem value="jpg">JPG (Image)</SelectItem>
                        <SelectItem value="glb">GLB (3D Model)</SelectItem>
                        <SelectItem value="fbx">FBX (3D Model)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolution" className="text-white">Resolution</Label>
                    <Select defaultValue="1024">
                      <SelectTrigger id="resolution" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="512">512 x 512</SelectItem>
                        <SelectItem value="1024">1024 x 1024</SelectItem>
                        <SelectItem value="2048">2048 x 2048</SelectItem>
                        <SelectItem value="4096">4096 x 4096 (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Box className="w-5 h-5 text-purple-400" />
                      Results
                    </CardTitle>
                    {generatedImages.length > 0 && (
                      <Badge className="bg-indigo-600 text-white">
                        {generatedImages.length} results
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    View and download AI-generated results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                        <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-white font-medium mb-2">Generating 3D product...</p>
                      <p className="text-sm text-gray-400">AI is processing your request</p>
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <Tabs defaultValue="grid" className="w-full">
                      <TabsList className="bg-[#0f1729] border-purple-500/30 mb-6">
                        <TabsTrigger value="grid" className="data-[state=active]:bg-indigo-600">
                          <Layers className="w-4 h-4 mr-2" />
                          Grid
                        </TabsTrigger>
                        <TabsTrigger value="list" className="data-[state=active]:bg-indigo-600">
                          <Image className="w-4 h-4 mr-2" />
                          List
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="grid">
                        <div className="grid md:grid-cols-2 gap-4">
                          {generatedImages.map((image, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="group relative aspect-square rounded-lg overflow-hidden border border-purple-500/20 hover:border-indigo-500/50 transition-colors"
                            >
                              <img
                                src={image}
                                alt={`Generated ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                  <span className="text-white font-medium text-sm">
                                    Result #{index + 1}
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="bg-white/90 hover:bg-white text-black"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="list">
                        <div className="space-y-4">
                          {generatedImages.map((image, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-4 p-4 bg-[#0f1729] rounded-lg border border-purple-500/20 hover:border-indigo-500/50 transition-colors"
                            >
                              <img
                                src={image}
                                alt={`Generated ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-1">Result #{index + 1}</h4>
                                <p className="text-sm text-gray-400 mb-2">
                                  Generated at {new Date().toLocaleTimeString("en-US")}
                                </p>
                                <div className="flex gap-2">
                                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                                    {selectedStyle}
                                  </Badge>
                                  <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30">
                                    {quality[0]}% quality
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                <Button size="sm" variant="outline" className="border-purple-500/30 text-white hover:bg-white/5">
                                  Edit
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2">
                        Ready to Generate 3D Products
                      </h3>
                      <p className="text-gray-400 text-sm max-w-md">
                        Enter a product description on the left and click "Generate with AI" to begin. 
                        AI will create multiple versions based on your description.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Cards */}
            {generatedImages.length === 0 && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid md:grid-cols-3 gap-4 mt-6"
              >
                {[
                  {
                    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
                    title: "Advanced AI",
                    description: "Latest AI technology for high-quality image generation",
                  },
                  {
                    icon: <Zap className="w-6 h-6 text-indigo-400" />,
                    title: "Fast",
                    description: "Generate 3D products in seconds",
                  },
                  {
                    icon: <Layers className="w-6 h-6 text-purple-400" />,
                    title: "Versatile",
                    description: "Multiple styles and formats available",
                  },
                ].map((item, index) => (
                  <Card
                    key={index}
                    className="bg-[#1a1f3a]/30 border-purple-500/10 backdrop-blur"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mb-3 flex justify-center">{item.icon}</div>
                      <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
