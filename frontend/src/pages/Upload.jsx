import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../api';
import { useToast } from '../components/Toast';

const categoryOptions = [
  { value: 'marksheet', label: 'Marksheet' },
  { value: 'admin_card', label: 'Admin Card' },
  { value: 'registration_certificate', label: 'Registration Certificate' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'other', label: 'Other Document' },
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('other');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      addToast('Only PDF, JPEG, PNG, and WebP files are supported', 'error');
      return false;
    }
    if (f.size > MAX_SIZE) {
      addToast('File size must be less than 10MB', 'error');
      return false;
    }
    return true;
  };

  const handleFileSelect = (f) => {
    if (validateFile(f)) {
      setFile(f);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Please select a file to upload', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      await documentApi.upload(formData);
      addToast('Document uploaded successfully to AWS S3!', 'success');
      navigate('/dashboard');
    } catch (error) {
      addToast(error.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card-wrapper">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="dashboard-title">Upload Academic Document</h1>
          <p className="dashboard-subtitle">Documents are encrypted and stored in private AWS S3 buckets</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Dropzone */}
          <div
            className={`upload-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            <div className="upload-cloud-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m16 16-4-4-4 4" />
              </svg>
            </div>

            <div>
              <p className="upload-title">
                Drag & drop your file here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p className="upload-hint" style={{ marginTop: '0.25rem' }}>
                Supports PDF, JPG, PNG, WebP (Max size: 10MB)
              </p>
            </div>
          </div>

          {/* Selected File Details Banner */}
          {file && (
            <div className="selected-file-card">
              <div className="file-thumb">
                {preview && file.type.startsWith('image/') ? (
                  <img src={preview} alt="Selected preview" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div className="file-details">
                <p className="file-details-name" title={file.name}>{file.name}</p>
                <p className="file-details-meta">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="btn btn-outline btn-sm"
                disabled={loading}
              >
                Change
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label htmlFor="category">
              <span>Document Category</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }}></div>
                  <span>Uploading to S3...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
