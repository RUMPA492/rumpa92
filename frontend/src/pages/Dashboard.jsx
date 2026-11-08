import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../api';
import { useToast } from '../components/Toast';

const categoryLabels = {
  marksheet: 'Marksheet',
  admin_card: 'Admin Card',
  registration_certificate: 'Registration Certificate',
  id_proof: 'ID Proof',
  other: 'Other Document',
};

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { addToast } = useToast();

  const handleDownload = async (url, originalName, id) => {
    try {
      setDownloadingId(id);
      addToast('Starting download...', 'info');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      addToast('Downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
      addToast('Opened document in new tab', 'info');
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await documentApi.getAll({ category: filter === 'all' ? '' : filter });
      setDocuments(data.documents);
    } catch (error) {
      addToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const handleDelete = async (id) => {
    try {
      await documentApi.delete(id);
      addToast('Document deleted successfully', 'success');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteId(null);
    } catch (error) {
      addToast('Failed to delete document', 'error');
    }
  };

  const confirmDelete = (id) => setDeleteId(id);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = {
    total: documents.length,
    images: documents.filter((d) => d.mimeType?.startsWith('image/')).length,
    pdfs: documents.filter((d) => d.mimeType === 'application/pdf').length,
  };

  const categoriesList = [
    { value: 'all', label: 'All Documents' },
    { value: 'marksheet', label: 'Marksheets' },
    { value: 'admin_card', label: 'Admin Cards' },
    { value: 'registration_certificate', label: 'Certificates' },
    { value: 'id_proof', label: 'ID Proofs' },
    { value: 'other', label: 'Others' },
  ];

  return (
    <div>
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Academic Vault</h1>
          <p className="dashboard-subtitle">Organize, secure, and access your verified documents on AWS cloud storage</p>
        </div>
        <Link to="/upload" className="btn btn-primary btn-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon indigo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Documents</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon emerald">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.images}</span>
            <span className="stat-label">Verified Images</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon amber">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M10 12v6" />
              <path d="M10 15h3a1.5 1.5 0 0 0 0-3h-3" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pdfs}</span>
            <span className="stat-label">PDF Certificates</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-bar">
        <div className="filter-pills">
          {categoriesList.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`filter-pill ${filter === cat.value ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Empty State */}
      {documents.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          <h3 className="empty-title">No documents found</h3>
          <p className="empty-desc">
            {filter === 'all'
              ? 'Your document vault is currently empty. Upload your marksheets, admin cards, or certificates to get started.'
              : `No documents categorized as "${categoryLabels[filter] || filter}". Try selecting another category.`}
          </p>
          <Link to="/upload" className="btn btn-primary">
            Upload Your First Document
          </Link>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((doc) => {
            const isImage = doc.mimeType?.startsWith('image/');
            const isPdf = doc.mimeType === 'application/pdf';

            return (
              <div key={doc.id} className="card document-card">
                <div className="document-preview-container">
                  {isImage ? (
                    <img 
                      src={doc.viewUrl} 
                      alt={doc.originalName} 
                      className="document-preview-img" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="document-fallback-icon">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="document-type-badge">
                        {isPdf ? 'PDF DOCUMENT' : doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="document-meta-top">
                  <span className={`badge-category badge-${doc.category || 'other'}`}>
                    {categoryLabels[doc.category] || doc.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="document-title" title={doc.originalName}>
                    {doc.originalName}
                  </h4>
                  <div className="document-info-row" style={{ marginTop: '0.35rem' }}>
                    <span className="document-info-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      {formatFileSize(doc.size)}
                    </span>
                  </div>
                </div>

                <div className="document-actions-row">
                  <a
                    href={doc.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    title="View Document"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>View</span>
                  </a>

                  <button
                    onClick={() => handleDownload(doc.viewUrl, doc.originalName, doc.id)}
                    className="btn btn-primary btn-sm"
                    disabled={downloadingId === doc.id}
                    title="Download File"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{downloadingId === doc.id ? 'Saving...' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() => confirmDelete(doc.id)}
                    className="btn btn-danger-outline btn-icon-only"
                    title="Delete Document"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Delete Document</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setDeleteId(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this document from AWS S3 storage? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
