'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { uploadImage, getSignedUrl } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setMessage('请选择文件');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('未登录');
      }

      const testId = `test-${Date.now()}`;
      const path = await uploadImage(user.id, testId, file);
      setUploadedPath(path);

      const url = await getSignedUrl(path);
      setSignedUrl(url);
      setMessage('上传成功！');
    } catch (error: any) {
      setMessage(`错误: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGetUrl = async () => {
    if (!uploadedPath) {
      setMessage('请先上传文件');
      return;
    }

    try {
      const url = await getSignedUrl(uploadedPath);
      setSignedUrl(url);
      setMessage('获取链接成功！');
    } catch (error: any) {
      setMessage(`错误: ${error.message}`);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Storage 测试页面</h1>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择图片文件
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? '上传中...' : '上传文件'}
              </button>
            </div>

            {uploadedPath && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-1">上传路径:</p>
                <p className="text-sm text-gray-600 break-all">{uploadedPath}</p>
                <button
                  onClick={handleGetUrl}
                  className="mt-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  获取预览链接
                </button>
              </div>
            )}

            {signedUrl && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">预览链接:</p>
                <p className="text-sm text-gray-600 break-all mb-4">{signedUrl}</p>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">预览:</p>
                  <img
                    src={signedUrl}
                    alt="预览"
                    className="max-w-full h-auto border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('错误') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

