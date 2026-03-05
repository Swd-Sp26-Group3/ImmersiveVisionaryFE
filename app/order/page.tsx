"use client";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { motion } from "motion/react";
import { ShoppingCart, Package, Camera, Clock, FileText, Upload, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function OrderProductPage() {
  const [orderType, setOrderType] = useState<"ready-made" | "custom">("ready-made");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Order 3D/AR Products
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose from ready-made products or order custom 3D/AR production tailored to your needs
          </p>
        </motion.div>

        {/* Order Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-white">Order Type</CardTitle>
              <CardDescription className="text-gray-400">
                Select the type of product you want to order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={orderType}
                onValueChange={(value) => setOrderType(value as "ready-made" | "custom")}
                className="grid md:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="ready-made"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    orderType === "ready-made"
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-purple-500/20 hover:border-purple-500/40"
                  }`}
                >
                  <RadioGroupItem value="ready-made" id="ready-made" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white">Ready-Made Products</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Instant download from catalog
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="custom"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    orderType === "custom"
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-purple-500/20 hover:border-purple-500/40"
                  }`}
                >
                  <RadioGroupItem value="custom" id="custom" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Custom Production</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Custom 3D/AR production on demand
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Form */}
        {orderType === "ready-made" ? (
          // Ready-Made Product Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Select From Catalog</CardTitle>
                <CardDescription className="text-gray-400">
                  Browse and select ready-made 3D/AR products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select>
                    <SelectTrigger id="category" className="bg-[#0f1729] border-purple-500/30 text-white">
                      <SelectValue placeholder="Select product category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-search" className="text-white">Search Products</Label>
                  <Input
                    id="product-search"
                    placeholder="Enter search keywords..."
                    className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="border border-purple-500/20 rounded-lg p-4 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h4 className="text-white font-medium mb-1">3D Model #{item}</h4>
                      <p className="text-sm text-gray-400 mb-2">Ready-made AR product</p>
                      <p className="text-indigo-400 font-semibold">$29</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="license" className="border-purple-500/30" />
                  <Label htmlFor="license" className="text-sm text-gray-300 cursor-pointer">
                    I agree to the terms of use and licensing
                  </Label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link href="/marketplace" className="flex-1">
                    <Button variant="outline" className="w-full border-purple-500/30 text-white hover:bg-white/5">
                      Browse Catalog
                    </Button>
                  </Link>
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Custom Production Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Project Information */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Project Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Provide details about the product you want to create in 3D
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-white">Project Name *</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g., XYZ Phone 3D Model"
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-type" className="text-white">Product Type *</Label>
                    <Select>
                      <SelectTrigger id="product-type" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail, including dimensions, colors, materials, and any special requirements..."
                    rows={5}
                    className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-white">Number of Models</Label>
                    <Input
                      id="quantity"
                      type="number"
                      defaultValue="1"
                      min="1"
                      className="bg-[#0f1729] border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-white">Desired Deadline</Label>
                    <Select>
                      <SelectTrigger id="deadline" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select deadline" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="standard">Standard (7-10 days)</SelectItem>
                        <SelectItem value="express">Express (3-5 days)</SelectItem>
                        <SelectItem value="rush">Rush (1-2 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-white">Estimated Budget</Label>
                    <Select>
                      <SelectTrigger id="budget" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="basic">$5 - $10</SelectItem>
                        <SelectItem value="standard">$10 - $30</SelectItem>
                        <SelectItem value="premium">$30 - $50</SelectItem>
                        <SelectItem value="enterprise">$50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Upload Reference Materials</CardTitle>
                <CardDescription className="text-gray-400">
                  Product images, technical drawings, or related documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Drag and drop files here or click to select</p>
                    <p className="text-sm text-gray-400">
                      Supported: JPG, PNG, PDF, DOC (Max 10MB per file)
                    </p>
                  </Label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Selected files:</Label>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-[#0f1729] rounded-lg border border-purple-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm text-white">{file.name}</span>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Additional Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="ar-ready" className="border-purple-500/30" />
                    <Label htmlFor="ar-ready" className="text-sm text-gray-300 cursor-pointer">
                      AR optimization for web and mobile (+$2)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="animation" className="border-purple-500/30" />
                    <Label htmlFor="animation" className="text-sm text-gray-300 cursor-pointer">
                      Add 3D animations (+$300)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="multiple-variants" className="border-purple-500/30" />
                    <Label htmlFor="multiple-variants" className="text-sm text-gray-300 cursor-pointer">
                      Multiple color/material variants (+$15)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="source-files" className="border-purple-500/30" />
                    <Label htmlFor="source-files" className="text-sm text-gray-300 cursor-pointer">
                      Include editable source files (+$10)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-white">Full Name *</Label>
                    <Input
                      id="contact-name"
                      placeholder="John Doe"
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-white">Company/Organization</Label>
                    <Input
                      id="company"
                      placeholder="Company name"
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Clock className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Production Process</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      After submitting your request, our team will contact you within 24 hours to:
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1 ml-4">
                      <li>• Confirm requirements and provide accurate quote</li>
                      <li>• Schedule product photoshoot (if needed)</li>
                      <li>• Establish timeline and review milestones</li>
                      <li>• Begin 3D/AR production process</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 border-purple-500/30 text-white hover:bg-white/5">
                    Save Draft
                  </Button>
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
