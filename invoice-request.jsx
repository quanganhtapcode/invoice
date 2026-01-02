import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, Send, Loader2, AlertCircle } from 'lucide-react';

export default function InvoiceRequestApp() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    mst: '',
    companyName: '',
    companyAddress: '',
    representative: ''
  });
  
  const [invoiceImage, setInvoiceImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const fetchCompanyInfo = async (mst) => {
    if (mst.length < 10) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://esgoo.net/api-mst/${mst}.htm`);
      const data = await response.json();
      
      if (data.error === 0) {
        setFormData(prev => ({
          ...prev,
          companyName: data.data.ten || '',
          companyAddress: data.data.dc || '',
          representative: data.data.daidien || ''
        }));
      } else {
        setError('Không tìm thấy thông tin doanh nghiệp với mã số thuế này');
      }
    } catch (err) {
      setError('Lỗi kết nối API. Vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  const handleMSTChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13);
    setFormData(prev => ({ ...prev, mst: value }));
    
    if (value.length >= 10) {
      fetchCompanyInfo(value);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoiceImage({
          file: file,
          preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name || !formData.phone || !formData.email || !formData.mst) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (!invoiceImage) {
      setError('Vui lòng chụp hoặc tải lên ảnh hóa đơn');
      return;
    }

    setLoading(true);
    
    // Simulate sending email/message (in production, integrate with backend API)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      
      // Create mailto link with all information
      const subject = encodeURIComponent(`Yêu cầu xuất hóa đơn - ${formData.companyName || formData.name}`);
      const body = encodeURIComponent(`
YÊU CẦU XUẤT HÓA ĐƠN - CỬA HÀNG CÁT HẢI

THÔNG TIN KHÁCH HÀNG:
- Họ tên: ${formData.name}
- Số điện thoại: ${formData.phone}
- Email: ${formData.email}

THÔNG TIN DOANH NGHIỆP:
- Mã số thuế: ${formData.mst}
- Tên công ty: ${formData.companyName}
- Địa chỉ: ${formData.companyAddress}
- Người đại diện: ${formData.representative}

Khách hàng đã tải lên ảnh hóa đơn.

---
Cửa hàng Cát Hải
      `);
      
      // Open mailto (you can replace this with actual email API)
      window.open(`mailto:youremail@example.com?subject=${subject}&body=${body}`);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      mst: '',
      companyName: '',
      companyAddress: '',
      representative: ''
    });
    setInvoiceImage(null);
    setSubmitted(false);
    setError('');
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <Check size={40} color="#ffffff" strokeWidth={3} />
          </div>
          
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            Yêu cầu đã được gửi
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: '#666666',
            lineHeight: '1.6',
            marginBottom: '40px'
          }}>
            Chúng tôi đã nhận được yêu cầu xuất hóa đơn của bạn. 
            Cửa hàng Cát Hải sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
          
          <button
            onClick={resetForm}
            style={{
              width: '100%',
              padding: '16px',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#333333';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#000000';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Gửi yêu cầu mới
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <header style={{
        maxWidth: '600px',
        margin: '0 auto 60px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '40px',
          fontWeight: '700',
          color: '#000000',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          Cát Hải
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#666666',
          fontWeight: '400',
          letterSpacing: '-0.01em'
        }}>
          Yêu cầu xuất hóa đơn
        </p>
      </header>

      {/* Main Form */}
      <main style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px'
            }}>
              Thông tin cá nhân
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Họ và tên *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Inter, sans-serif',
                  background: '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />

              <input
                type="tel"
                placeholder="Số điện thoại *"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Inter, sans-serif',
                  background: '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />

              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Inter, sans-serif',
                  background: '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </section>

          {/* Company Information */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px'
            }}>
              Thông tin doanh nghiệp
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Mã số thuế *"
                  value={formData.mst}
                  onChange={handleMSTChange}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    fontSize: '16px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Inter, sans-serif',
                    background: '#ffffff',
                    paddingRight: loading ? '50px' : '20px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
                {loading && (
                  <Loader2
                    size={20}
                    style={{
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                )}
              </div>

              {formData.companyName && (
                <>
                  <input
                    type="text"
                    placeholder="Tên công ty"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      fontSize: '16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif',
                      background: '#f8f8f8'
                    }}
                    readOnly
                  />

                  <textarea
                    placeholder="Địa chỉ"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      fontSize: '16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif',
                      background: '#f8f8f8',
                      resize: 'vertical'
                    }}
                    readOnly
                  />

                  <input
                    type="text"
                    placeholder="Người đại diện"
                    value={formData.representative}
                    onChange={(e) => setFormData(prev => ({ ...prev, representative: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      fontSize: '16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif',
                      background: '#f8f8f8'
                    }}
                    readOnly
                  />
                </>
              )}
            </div>
          </section>

          {/* Invoice Image Upload */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px'
            }}>
              Ảnh hóa đơn *
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {!invoiceImage ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    flex: 1,
                    padding: '20px',
                    background: '#f8f8f8',
                    border: '2px dashed #e5e5e5',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#000000';
                    e.target.style.background = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e5e5';
                    e.target.style.background = '#f8f8f8';
                  }}
                >
                  <Camera size={32} color="#000000" />
                  <span style={{ fontSize: '14px', color: '#666666' }}>Chụp ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const input = fileInputRef.current;
                    input.removeAttribute('capture');
                    input.click();
                    setTimeout(() => input.setAttribute('capture', 'environment'), 100);
                  }}
                  style={{
                    flex: 1,
                    padding: '20px',
                    background: '#f8f8f8',
                    border: '2px dashed #e5e5e5',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#000000';
                    e.target.style.background = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e5e5';
                    e.target.style.background = '#f8f8f8';
                  }}
                >
                  <Upload size={32} color="#000000" />
                  <span style={{ fontSize: '14px', color: '#666666' }}>Tải lên</span>
                </button>
              </div>
            ) : (
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e5e5e5'
              }}>
                <img
                  src={invoiceImage.preview}
                  alt="Invoice preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setInvoiceImage(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '8px 16px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  Thay đổi
                </button>
              </div>
            )}
          </section>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '16px 20px',
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <AlertCircle size={20} color="#e53e3e" />
              <span style={{ fontSize: '14px', color: '#c53030' }}>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontFamily: 'Inter, sans-serif',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = '#333333';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#000000';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={20} />
                Gửi yêu cầu
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer style={{
          marginTop: '60px',
          textAlign: 'center',
          paddingTop: '40px',
          borderTop: '1px solid #e5e5e5'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#999999',
            marginBottom: '8px'
          }}>
            Cửa hàng Cát Hải
          </p>
          <p style={{
            fontSize: '13px',
            color: '#cccccc'
          }}>
            © 2026 Bản quyền thuộc về Cát Hải
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}