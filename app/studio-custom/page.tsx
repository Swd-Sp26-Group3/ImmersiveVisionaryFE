"use client";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";
import { Box, Palette, Layers, Download, RotateCw, Settings, Maximize, Eye, Save } from "lucide-react";

export default function DesignStudioPage() {
  const [selectedProduct, setSelectedProduct] = useState("smartphone");
  const [selectedMaterial, setSelectedMaterial] = useState("metal");
  const [selectedColor, setSelectedColor] = useState("#1e293b");
  const [rotation, setRotation] = useState([0]);
  const [zoom, setZoom] = useState([100]);
  const [isLoading, setIsLoading] = useState(false);

  const products = [
    { id: "smartphone", name: "Smartphone", preview: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop" },
    { id: "headphones", name: "Headphones", preview: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop" },
    { id: "watch", name: "Smartwatch", preview: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" },
    { id: "speaker", name: "Speaker", preview: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop" },
  ];

  const materials = [
    { id: "metal", name: "Brushed Metal", icon: "🔘" },
    { id: "glass", name: "Glossy Glass", icon: "💎" },
    { id: "matte", name: "Matte Plastic", icon: "⬜" },
    { id: "carbon", name: "Carbon Fiber", icon: "⬛" },
  ];

  const colorPresets = [
    { name: "Slate", value: "#1e293b" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Red", value: "#ef4444" },
    { name: "Gold", value: "#eab308" },
    { name: "Silver", value: "#94a3b8" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
  ];

  const handleApplyCustomization = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

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
            <Box className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Interactive 3D Customization</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Design Studio
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Customize 3D products with real-time preview. Choose materials, colors, and configurations to visualize your perfect design.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Box className="w-5 h-5 text-purple-400" />
                    Product
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Select a product to customize
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedProduct === product.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-purple-500/20 hover:border-purple-500/40"
                        }`}
                      >
                        <div className="aspect-square rounded-md overflow-hidden mb-2">
                          <img
                            src={product.preview}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          selectedProduct === product.id ? "text-white" : "text-gray-400"
                        }`}>
                          {product.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Material Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Material
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {materials.map((material) => (
                      <button
                        key={material.id}
                        onClick={() => setSelectedMaterial(material.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedMaterial === material.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-purple-500/20 hover:border-purple-500/40"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">{material.icon}</span>
                          <span className={`text-xs font-medium ${
                            selectedMaterial === material.id ? "text-white" : "text-gray-400"
                          }`}>
                            {material.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Color Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Color
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedColor === color.value
                            ? "border-indigo-500 scale-110"
                            : "border-purple-500/20 hover:border-purple-500/40"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-color" className="text-white text-sm">Custom Color</Label>
                    <input
                      id="custom-color"
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-10 rounded-lg border-2 border-purple-500/30 bg-[#0f1729] cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* View Controls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    View Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rotation" className="text-white">
                      Rotation: {rotation[0]}°
                    </Label>
                    <Slider
                      id="rotation"
                      value={rotation}
                      onValueChange={setRotation}
                      min={0}
                      max={360}
                      step={15}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoom" className="text-white">
                      Zoom: {zoom[0]}%
                    </Label>
                    <Slider
                      id="zoom"
                      value={zoom}
                      onValueChange={setZoom}
                      min={50}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="export-format" className="text-white">Export Format</Label>
                    <Select defaultValue="png">
                      <SelectTrigger id="export-format" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="png">PNG (Image)</SelectItem>
                        <SelectItem value="jpg">JPG (Image)</SelectItem>
                        <SelectItem value="glb">GLB (3D Model)</SelectItem>
                        <SelectItem value="fbx">FBX (3D Model)</SelectItem>
                        <SelectItem value="obj">OBJ (3D Model)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Apply Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={handleApplyCustomization}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-5 h-5 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-white/5"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-white/5"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Preview */}
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
                      <Maximize className="w-5 h-5 text-purple-400" />
                      3D Preview
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                        {selectedMaterial}
                      </Badge>
                      <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30">
                        Interactive
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-gray-400">
                    Rotate, zoom, and preview your customized product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 3D Preview Area */}
                  <div className="relative aspect-square md:aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/20 overflow-hidden mb-6">
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-white font-medium">Applying customization...</p>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      className="w-full h-full flex items-center justify-center p-8 transition-transform duration-500"
                      style={{ 
                        transform: `rotate(${rotation[0]}deg) scale(${zoom[0] / 100})`,
                      }}
                    >
                      {currentProduct && (
                        <div className="relative max-w-full max-h-full">
                          <img
                            src={currentProduct.preview}
                            alt={currentProduct.name}
                            className="w-full h-full object-contain rounded-lg shadow-2xl"
                            style={{
                              filter: `hue-rotate(${selectedColor === '#1e293b' ? 0 : 45}deg) brightness(${selectedColor === '#000000' ? 0.7 : 1.1})`
                            }}
                          />
                          {/* Color overlay */}
                          <div 
                            className="absolute inset-0 rounded-lg mix-blend-overlay opacity-30"
                            style={{ backgroundColor: selectedColor }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Interaction hints */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Badge className="bg-black/60 text-white border-0">
                        <RotateCw className="w-3 h-3 mr-1" />
                        Use controls to rotate
                      </Badge>
                      <Badge className="bg-black/60 text-white border-0">
                        <Maximize className="w-3 h-3 mr-1" />
                        Zoom: {zoom[0]}%
                      </Badge>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <Tabs defaultValue="specs" className="w-full">
                    <TabsList className="bg-[#0f1729] border-purple-500/30 mb-6 w-full">
                      <TabsTrigger value="specs" className="data-[state=active]:bg-indigo-600 flex-1">
                        Specifications
                      </TabsTrigger>
                      <TabsTrigger value="variations" className="data-[state=active]:bg-indigo-600 flex-1">
                        Variations
                      </TabsTrigger>
                      <TabsTrigger value="export" className="data-[state=active]:bg-indigo-600 flex-1">
                        Export
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="specs" className="space-y-4">
                      <Card className="bg-[#0f1729]/50 border-purple-500/10">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Product:</span>
                            <span className="text-white font-medium">{currentProduct?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Material:</span>
                            <span className="text-white font-medium">
                              {materials.find(m => m.id === selectedMaterial)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Color:</span>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-white/20"
                                style={{ backgroundColor: selectedColor }}
                              />
                              <span className="text-white font-medium">{selectedColor}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Rotation:</span>
                            <span className="text-white font-medium">{rotation[0]}°</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Zoom Level:</span>
                            <span className="text-white font-medium">{zoom[0]}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="variations" className="space-y-3">
                      <p className="text-sm text-gray-400 mb-4">
                        Save and compare different design variations
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((index) => (
                          <Card
                            key={index}
                            className="bg-[#0f1729]/50 border-purple-500/10 hover:border-indigo-500/50 transition-colors cursor-pointer"
                          >
                            <CardContent className="p-3 text-center">
                              <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg mb-2 flex items-center justify-center">
                                <Layers className="w-8 h-8 text-gray-600" />
                              </div>
                              <p className="text-xs text-gray-400">Variation {index}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="export" className="space-y-4">
                      <p className="text-sm text-gray-400 mb-4">
                        Export your customized product design
                      </p>
                      <div className="space-y-3">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Download className="w-4 h-4 mr-2" />
                          Download Preview (PNG)
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-purple-500/30 text-white hover:bg-white/5"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download 3D Model
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-purple-500/30 text-white hover:bg-white/5"
                        >
                          <Box className="w-4 h-4 mr-2" />
                          Order Custom Production
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-4 mt-6"
            >
              {[
                {
                  icon: <Box className="w-6 h-6 text-purple-400" />,
                  title: "Real-time Preview",
                  description: "See changes instantly as you customize",
                },
                {
                  icon: <Palette className="w-6 h-6 text-indigo-400" />,
                  title: "Unlimited Options",
                  description: "Mix materials, colors, and configurations",
                },
                {
                  icon: <Download className="w-6 h-6 text-purple-400" />,
                  title: "Export Ready",
                  description: "Download previews or 3D model files",
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
          </div>
        </div>
      </div>
    </div>
  );
}
