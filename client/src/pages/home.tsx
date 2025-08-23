import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Copy, 
  ExternalLink, 
  Clock, 
  Shield, 
  UserX, 
  Zap,
  Heart,
  CheckCircle,
  FolderOpen,
  Plus,
  CloudUpload,
  HourglassIcon,
  Calendar,
  CalendarDays
} from 'lucide-react';
import type { UploadResult } from '@uppy/core';

interface UploadedFile {
  id: string;
  shareId: string;
  shareUrl: string;
  filename: string;
  size: number;
  expiresAt: string;
  sizeFormatted: string;
  expirationText: string;
}

interface UploadingFile {
  name: string;
  size: number;
  progress: number;
  sizeFormatted: string;
}

export default function Home() {
  const { toast } = useToast();
  const [selectedExpiration, setSelectedExpiration] = useState<'1h' | '1d' | '1w'>('1d');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpirationText = (expiration: string): string => {
    switch (expiration) {
      case '1h': return '1 hour';
      case '1d': return '1 day';
      case '1w': return '1 week';
      default: return '1 day';
    }
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    
    const { uploadURL } = await response.json();
    return {
      method: 'PUT' as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult) => {
    if (result.successful.length === 0) {
      toast({
        title: "Upload Failed",
        description: "No files were uploaded successfully.",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (const file of result.successful) {
        const fileData = {
          objectPath: file.uploadURL || '',
          filename: file.name || '',
          originalName: file.name || '',
          mimeType: file.type || 'application/octet-stream',
          size: file.size || 0,
          expiration: selectedExpiration,
        };

        const response = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fileData),
        });

        if (response.ok) {
          const savedFile = await response.json();
          uploadedFiles.push({
            ...savedFile,
            sizeFormatted: formatFileSize(savedFile.size),
            expirationText: getExpirationText(selectedExpiration),
          });
        }
      }

      setUploadedFiles(uploadedFiles);
      setIsUploading(false);
      
      toast({
        title: "Upload Complete",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error completing upload:', error);
      toast({
        title: "Error",
        description: "Failed to complete file upload.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Handle dropped files - this would trigger the ObjectUploader
      setIsUploading(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-dark">FileBin</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center">
                <UserX className="w-4 h-4 mr-2" />
                Anonymous
              </span>
              <span className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Fast
              </span>
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Secure
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Free
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-dark mb-6">
            Share Files{' '}
            <span className="text-primary">Instantly</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            No sign-ups. No tracking. No limits. Just upload, get a link, and share.
            Your files are encrypted and automatically deleted when you choose.
          </p>
        </div>

        {/* Upload Area */}
        {!isUploading && uploadedFiles.length === 0 && (
          <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors duration-200 mb-8">
            <CardContent 
              className="p-12 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <CloudUpload className="w-24 h-24 text-gray-300" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-dark mb-3">Drop files here</h3>
              <p className="text-gray-500 mb-6">or click to browse your files</p>

              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="bg-primary hover:bg-blue-600 text-white font-medium px-8 py-3 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose Files</span>
                </div>
              </ObjectUploader>

              <div className="mt-6 text-sm text-gray-400">
                <p>Maximum file size: <strong>2GB</strong> • Supported: All file types</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-dark mb-4">Uploading Files</h4>
              <div className="space-y-4">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.sizeFormatted}</p>
                      <Progress value={file.progress} className="w-full mt-2" />
                    </div>
                    <div className="text-sm text-gray-500">{file.progress}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiration Settings */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              Auto-Delete After
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="expiration"
                  value="1h"
                  checked={selectedExpiration === '1h'}
                  onChange={(e) => setSelectedExpiration(e.target.value as '1h' | '1d' | '1w')}
                  className="sr-only"
                />
                <div className={`border-2 rounded-xl p-4 text-center transition-colors duration-200 ${
                  selectedExpiration === '1h' 
                    ? 'border-primary bg-blue-50' 
                    : 'border-gray-200 hover:border-primary'
                }`}>
                  <HourglassIcon className={`w-8 h-8 mx-auto mb-2 ${
                    selectedExpiration === '1h' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-dark">1 Hour</h5>
                  <p className="text-sm text-gray-500">Quick sharing</p>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="expiration"
                  value="1d"
                  checked={selectedExpiration === '1d'}
                  onChange={(e) => setSelectedExpiration(e.target.value as '1h' | '1d' | '1w')}
                  className="sr-only"
                />
                <div className={`border-2 rounded-xl p-4 text-center transition-colors duration-200 ${
                  selectedExpiration === '1d' 
                    ? 'border-primary bg-blue-50' 
                    : 'border-gray-200 hover:border-primary'
                }`}>
                  <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                    selectedExpiration === '1d' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-dark">1 Day</h5>
                  <p className="text-sm text-gray-500">Recommended</p>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="expiration"
                  value="1w"
                  checked={selectedExpiration === '1w'}
                  onChange={(e) => setSelectedExpiration(e.target.value as '1h' | '1d' | '1w')}
                  className="sr-only"
                />
                <div className={`border-2 rounded-xl p-4 text-center transition-colors duration-200 ${
                  selectedExpiration === '1w' 
                    ? 'border-primary bg-blue-50' 
                    : 'border-gray-200 hover:border-primary'
                }`}>
                  <CalendarDays className={`w-8 h-8 mx-auto mb-2 ${
                    selectedExpiration === '1w' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-dark">1 Week</h5>
                  <p className="text-sm text-gray-500">Extended access</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* File Links Section */}
        {uploadedFiles.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-dark mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-3 text-success" />
                Your Files Are Ready
              </h4>

              <div className="space-y-4">
                {uploadedFiles.map((file, index) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 pt-1">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-dark mb-1">{file.filename}</h5>
                        <p className="text-xs text-gray-500 mb-3">
                          {file.sizeFormatted} • Expires in {file.expirationText}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <code className="text-sm text-gray-700 font-mono break-all flex-1 mr-3">
                              {file.shareUrl}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(file.shareUrl)}
                              className="text-primary hover:text-blue-600 shrink-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(file.shareUrl)}
                            className="text-primary hover:text-blue-600 font-medium"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-600 hover:text-gray-800 font-medium"
                          >
                            <a href={file.shareUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open File
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Files uploaded successfully!</p>
                    <p>Share these links with anyone. Files will be automatically deleted after the selected time period. No logs are kept.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-dark mb-2">Anonymous</h4>
            <p className="text-gray-600">No accounts, no personal information required. Upload and share completely anonymously.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-success" />
            </div>
            <h4 className="text-lg font-semibold text-dark mb-2">Encrypted</h4>
            <p className="text-gray-600">All files are encrypted during transfer and storage. Your data is protected at every step.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-dark mb-2">Auto-Delete</h4>
            <p className="text-gray-600">Files are automatically deleted after your chosen time period. Nothing stays forever.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <FolderOpen className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">FileBin - Anonymous File Sharing</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>No logs • No tracking • No ads</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
