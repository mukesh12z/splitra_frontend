import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ReceiptScanner = ({ onExtract, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload and extract
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await axios.post(`${API_URL}/expenses/scan-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setExtractedData(response.data.data);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      alert('Failed to scan receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData && onExtract) {
      onExtract({
        amount: extractedData.amount,
        description: extractedData.merchant || 'Scanned Receipt',
        date: extractedData.date || new Date().toISOString()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Scan Receipt</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Upload a receipt image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition inline-flex items-center gap-2"
              >
                <Upload size={20} />
                Choose Image
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full rounded-lg"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <Loader className="animate-spin text-white" size={48} />
                  </div>
                )}
              </div>

              {extractedData && !loading && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Extracted Data</h4>
                  <div className="space-y-2 text-sm">
                    {extractedData.merchant && (
                      <div>
                        <span className="font-medium">Merchant:</span> {extractedData.merchant}
                      </div>
                    )}
                    {extractedData.amount && (
                      <div>
                        <span className="font-medium">Amount:</span> ${extractedData.amount.toFixed(2)}
                      </div>
                    )}
                    {extractedData.date && (
                      <div>
                        <span className="font-medium">Date:</span> {extractedData.date}
                      </div>
                    )}
                    {extractedData.possibleAmounts && extractedData.possibleAmounts.length > 1 && (
                      <div>
                        <span className="font-medium">Other amounts found:</span>{' '}
                        {extractedData.possibleAmounts.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPreview(null);
                    setExtractedData(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Scan Another
                </button>
                {extractedData && (
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Use This Data
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;