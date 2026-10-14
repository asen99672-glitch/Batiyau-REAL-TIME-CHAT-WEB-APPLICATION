import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';

const HelpSettings = ({ onBack }) => {
  const { showToast } = useChat();
  const [activeFaq, setActiveFaq] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const faqs = [
    {
      q: 'How does End-to-End Encryption work in Batiyau?',
      a: 'Batiyau secures your messages and calls with End-to-End Encryption (E2EE) using Elliptic Curve Diffie-Hellman (ECDH P-256) and AES-GCM-256. Your messages are encrypted directly on your device before leaving it, meaning only you and the recipient can read them — not even the server or developers.',
    },
    {
      q: 'How do I verify the security code with a contact?',
      a: 'Open the contact info panel for any user and click "Encryption" to view the 60-digit security number and QR code. You can scan the QR code on their device or compare the numbers to verify encryption authenticity.',
    },
    {
      q: 'How do disappearing messages work?',
      a: 'You can set a default message timer (24 hours, 7 days, or 90 days) in Privacy settings, or enable disappearing messages inside individual chat header menus. Messages automatically disappear once the selected duration expires.',
    },
    {
      q: 'How do I protect my IP address in calls?',
      a: 'Go to Settings → Privacy → Advanced and toggle on "Protect IP address in calls". When enabled, WebRTC calls are relayed securely through servers instead of direct peer-to-peer, keeping your network location masked.',
    },
    {
      q: 'What is App Lock and how does it work?',
      a: 'App Lock protects your chat software with a 4-digit PIN. You can configure it to lock immediately on tab switch/minimize, or automatically after 1, 15, or 30 minutes of inactivity.',
    },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactMsg.trim()) {
      showToast('Please describe your issue', 'error');
      return;
    }
    setSendingContact(true);
    setTimeout(() => {
      setSendingContact(false);
      setShowContactModal(false);
      setContactSubject('');
      setContactMsg('');
      showToast('Support ticket submitted. Our team will get back to you shortly ✓', 'success');
    }, 800);
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    borderBottom: '1px solid var(--border-subtle, #1e2127)',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        background: 'var(--bg-primary, #111215)',
        color: 'var(--text-primary, #f3f4f6)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'var(--bg-card, #17191e)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#4ee3c5',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Help</h2>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* HELP MENU ITEMS */}
        <div
          style={{
            background: 'var(--bg-card, #17191e)',
            borderRadius: 14,
            border: '1px solid var(--border-subtle, #1e2127)',
            overflow: 'hidden',
          }}
        >
          {/* Contact us */}
          <div
            onClick={() => setShowContactModal(true)}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: 500, color: '#ffffff' }}>Contact us</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Questions? Need help? Tell us about your issue.
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
          </div>

          {/* Terms and Privacy Policy */}
          <div
            onClick={() => {
              showToast('Batiyau operates under zero-knowledge end-to-end encryption privacy policy.', 'info');
            }}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: 500, color: '#ffffff' }}>Terms and Privacy Policy</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Read our terms of service and zero-logging policy.
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
          </div>

          {/* Channel Info */}
          <div
            style={{
              ...rowStyle,
              borderBottom: 'none',
              cursor: 'default',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: 500, color: '#ffffff' }}>App version</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#00a884', fontWeight: 600 }}>
                Batiyau Web v2.5.0 (Official Build) • 🔒 End-to-End Encrypted
              </p>
            </div>
          </div>
        </div>

        {/* FAQS SECTION */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Frequently Asked Questions
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderBottom: idx === faqs.length - 1 ? 'none' : '1px solid var(--border-subtle, #1e2127)',
                  }}
                >
                  <div
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isOpen ? 'var(--bg-hover)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#ffffff', flex: 1, paddingRight: 10 }}>
                      {faq.q}
                    </span>
                    <span style={{ color: '#00a884', fontSize: 16, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                      ›
                    </span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Us Modal */}
      {showContactModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--bg-secondary, #131418)',
              borderRadius: 18,
              border: '1px solid var(--border-color)',
              padding: 24,
              boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: '#ffffff' }}>Contact Support</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Describe your issue and provide details. Include any error messages you encountered.
            </p>

            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Topic / Subject (Optional)"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-primary, #111215)',
                  border: '1px solid var(--border-color)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />

              <textarea
                rows={4}
                placeholder="Describe your problem or feedback..."
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-primary, #111215)',
                  border: '1px solid var(--border-color)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    background: 'var(--bg-hover)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingContact}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    background: '#00a884',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: sendingContact ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendingContact ? 'Submitting...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSettings;
