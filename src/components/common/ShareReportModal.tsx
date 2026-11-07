import React, { useState } from 'react';
import {
  X,
  FileText,
  Mail,
  Copy,
  Check,
  Share2,
  Send,
  Sparkles,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import {
  authenticateGoogleWorkspace,
  fetchGoogleContacts,
  sendGmailMessage,
  GoogleContact,
  getCachedAccessToken
} from '../../utils/googleWorkspace';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string; // e.g. "Surevin_Subject_Graphs_Class_XII.pdf"
  className: string; // e.g. "Class XII – PCM"
  examName: string; // e.g. "Mid-Term Examination 2026"
  teacherName: string;
  pdfBlobUrl?: string;
  onDownloadPdf?: () => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  className,
  examName,
  teacherName,
  pdfBlobUrl,
  onDownloadPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'gmail'>('quick');
  const [copied, setCopied] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Gmail & Contacts State
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Surevin Academic Report Card - ${className} (${examName})`);
  const [emailBody, setEmailBody] = useState(
    `Respected Parent / Student,\n\nPlease find attached the official academic performance report card from Surevin International Residential School.\n\nExam: ${examName}\nClass: ${className}\nTeacher: ${teacherName}\n\nWarm regards,\nSurevin Academic Administration`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const shareText = `📚 *Surevin International School Academic Report*\n\n🏫 *School:* Surevin International Residential School, Niwari Modinagar\n📝 *Exam:* ${examName}\n🎓 *Class:* ${className}\n👩‍🏫 *Teacher:* ${teacherName}\n\n📄 *Report PDF:* ${reportTitle}\n🔗 Access Report Portal: ${currentUrl}`;

  const showToast = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(null), 3500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}`);
    setCopied(true);
    showToast('Report details & link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp Share...');
  };

  const handleEmailClient = () => {
    const subject = encodeURIComponent(`Academic Report: ${examName} - ${className}`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    showToast('Opening Email Client...');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    showToast('Opening Telegram Share...');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
    showToast('Opening Facebook Share...');
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(shareText);
    showToast('Report caption copied! Opening Instagram...');
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 800);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Surevin Report: ${examName}`,
          text: shareText,
          url: currentUrl,
        });
        showToast('Shared successfully!');
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Google Workspace API Handlers
  const handleLoadGoogleContacts = async () => {
    setLoadingContacts(true);
    setEmailErrorMsg(null);
    try {
      const { accessToken } = await authenticateGoogleWorkspace();
      const list = await fetchGoogleContacts(accessToken);
      setContacts(list);
      showToast(`Loaded ${list.length} contacts from Google Account.`);
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Failed to load Google Contacts.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContactChange = (emailVal: string) => {
    setSelectedContact(emailVal);
    if (emailVal) setRecipientEmail(emailVal);
  };

  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErrorMsg(null);
    setEmailSuccessMsg(null);

    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setEmailErrorMsg('Please provide a valid recipient email address.');
      return;
    }

    // Require explicit confirmation modal per Workspace skill directive
    setShowConfirmModal(true);
  };

  const handleConfirmSendGmail = async () => {
    setShowConfirmModal(false);
    setIsSendingEmail(true);
    setEmailErrorMsg(null);
    setEmailSuccessMsg(null);

    try {
      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await authenticateGoogleWorkspace();
        token = authRes.accessToken;
      }

      await sendGmailMessage(token, {
        to: recipientEmail.trim(),
        subject: emailSubject.trim(),
        bodyText: emailBody.trim(),
      });

      setEmailSuccessMsg(`Email successfully sent via Gmail API to ${recipientEmail.trim()}!`);
      showToast('Gmail message delivered successfully!');
    } catch (err: any) {
      console.error('Gmail send error:', err);
      setEmailErrorMsg(err.message || 'Failed to send email via Gmail API.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Share Your Report</h3>
              <p className="text-3xs text-slate-400 font-mono">Surevin International School Academic Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xs font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono uppercase">
              PDF Ready
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quick' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Quick Social Apps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gmail' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Gmail & Google Contacts</span>
          </button>
        </div>

        {/* PDF Document Preview Card */}
        <div className="p-6 space-y-6">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate font-mono" title={reportTitle}>
                  {reportTitle.endsWith('.pdf') ? reportTitle : `${reportTitle}.pdf`}
                </div>
                <div className="text-3xs text-slate-400 truncate mt-0.5">
                  Class {className} · Subject-wise performance report
                </div>
              </div>
            </div>

            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-3xs rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Download PDF
              </button>
            )}
          </div>

          {/* Toast Notification Banner */}
          {activeNotification && (
            <div className="p-3 bg-blue-950/80 border border-blue-500/50 rounded-xl text-blue-200 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{activeNotification}</span>
            </div>
          )}

          {activeTab === 'quick' ? (
            /* Quick Share Grid */
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">WhatsApp</span>
              </button>

              {/* Email Client */}
              <button
                type="button"
                onClick={handleEmailClient}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Email App</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-pink-950/50 border border-slate-800 hover:border-pink-500/50 text-slate-300 hover:text-pink-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">Instagram</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-sky-950/50 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Telegram</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">Facebook</span>
              </button>

              {/* Copy Link / Native Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          ) : (
            /* Gmail & Google Contacts Tab */
            <form onSubmit={handleRequestSendEmail} className="space-y-4 text-xs">
              {emailSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{emailSuccessMsg}</span>
                </div>
              )}

              {emailErrorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{emailErrorMsg}</span>
                </div>
              )}

              {/* Load Contacts Button */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block">Google Contacts API</span>
                    <span className="text-3xs text-slate-400">Import addresses directly from your account</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadGoogleContacts}
                  disabled={loadingContacts}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-slate-700 font-bold text-3xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {loadingContacts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  <span>{loadingContacts ? 'Loading...' : contacts.length > 0 ? `Loaded (${contacts.length})` : 'Import Contacts'}</span>
                </button>
              </div>

              {/* Select from loaded contacts if available */}
              {contacts.length > 0 && (
                <div>
                  <label className="block text-3xs font-bold uppercase text-slate-400 mb-1">
                    Select Contact Address
                  </label>
                  <select
                    value={selectedContact}
                    onChange={(e) => handleSelectContactChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500"
                  >
                    <option value="">-- Choose from Google Contacts ({contacts.length}) --</option>
                    {contacts.map((c, i) => (
                      <option key={i} value={c.email}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 mb-1">
                  Email Message Body
                </label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSendingEmail ? 'Sending via Gmail...' : 'Send Direct Email via Gmail API'}</span>
              </button>
            </form>
          )}
        </div>

        {/* User Confirmation Modal for Destructive/Mutating Workspace Action */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>Confirm Email Dispatch</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to send this academic report email directly via your authorized Gmail account to:
                <span className="block font-mono font-bold text-white mt-1">{recipientEmail}</span>
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendGmail}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-3xs text-slate-400 px-6">
          <span>Surevin International Residential School</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Workspace Engine
          </span>
        </div>
      </div>
    </div>
  );
};
