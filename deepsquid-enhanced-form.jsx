import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Save, Calendar, Clock, Image, Video, Hash, TrendingUp, AlertTriangle, Check, X, Copy, Trash2, MapPin, ChevronDown, ChevronUp, Eye, Info } from 'lucide-react';

const DeepSquidContentForm = () => {
  // State management
  const [mediaFiles, setMediaFiles] = useState({ video: null, image: null });
  const [originalCaption, setOriginalCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [captions, setCaptions] = useState({
    group1: { ai: '', final: '' }, // Instagram, TikTok, Threads, Facebook
    group2: { ai: '', final: '' }  // YouTube Shorts
  });
  
  const [platforms, setPlatforms] = useState({
    instagram: { enabled: true, length: 45 },
    tiktok: { enabled: true, length: 45 },
    threads: { enabled: true, length: 45 },
    facebook: { enabled: true, length: 45 },
    youtube: { enabled: true, length: 45 },
    linkedin: { enabled: false, length: 45 },
    twitter: { enabled: false, length: 45 }
  });
  
  const [scheduling, setScheduling] = useState({
    date: '',
    time: '',
    postImmediately: false
  });
  
  const [preferences, setPreferences] = useState({
    rememberPlatforms: true,
    rememberHashtags: true,
    autoEnhance: false
  });
  
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState('default');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const [drafts, setDrafts] = useState([]);
  const [applyLengthToAll, setApplyLengthToAll] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // PHASE 1A: Hashtag validation and character counting
  const parseHashtags = (input) => {
    if (!input) return [];
    return input
      .split(',')
      .map(tag => {
        const cleaned = tag.trim().replace(/[^a-zA-Z0-9]/g, '');
        return cleaned.length >= 2 ? '#' + cleaned.toLowerCase() : '';
      })
      .filter(tag => tag.length > 1)
      .slice(0, 5); // HARD LIMIT: Max 5 hashtags
  };
  
  const getTotalCharCount = (caption, hashtagArray) => {
    const hashtagString = hashtagArray.join(' ');
    return caption.length + (hashtagString.length > 0 ? hashtagString.length + 1 : 0);
  };
  
  const getCharStatus = (count, limit) => {
    if (count === 0) return { status: 'empty', color: 'text-gray-400', icon: null };
    if (count < limit * 0.8) return { status: 'good', color: 'text-green-500', icon: Check };
    if (count < limit) return { status: 'warning', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'error', color: 'text-red-500', icon: X };
  };
  
  // Platform character limits
  const platformLimits = {
    group1: 2200, // Instagram, TikTok, Threads, Facebook
    group2: 100,  // YouTube Shorts
  };
  
  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      saveDraft('auto');
    }, 30000);
    
    return () => clearInterval(autoSave);
  }, [originalCaption, hashtags, mediaFiles, captions, platforms]);
  
  // Load saved data on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, []);
  
  // Load templates and preferences from localStorage
  const loadFromLocalStorage = () => {
    const savedTemplates = localStorage.getItem('deepsquid_templates');
    const savedPreferences = localStorage.getItem('deepsquid_preferences');
    const savedDrafts = localStorage.getItem('deepsquid_drafts');
    
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
    if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
  };
  
  // Save draft
  const saveDraft = (type = 'manual') => {
    if (!originalCaption && !mediaFiles.video && !mediaFiles.image) return;
    
    const draft = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      originalCaption,
      hashtags,
      captions,
      platforms,
      scheduling,
      type
    };
    
    const updatedDrafts = [draft, ...drafts.filter(d => d.type !== 'auto').slice(0, 9)];
    setDrafts(updatedDrafts);
    localStorage.setItem('deepsquid_drafts', JSON.stringify(updatedDrafts));
    
    if (type === 'manual') {
      alert('✅ Draft saved!');
    }
  };
  
  // Load draft
  const loadDraft = (draft) => {
    setOriginalCaption(draft.originalCaption);
    setHashtags(draft.hashtags);
    setCaptions(draft.captions);
    setPlatforms(draft.platforms);
    setScheduling(draft.scheduling);
  };
  
  // Save as template
  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    const template = {
      id: Date.now(),
      name: newTemplateName,
      platforms: { ...platforms },
      hashtags,
      preferences: { ...preferences }
    };
    
    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('deepsquid_templates', JSON.stringify(updatedTemplates));
    setShowTemplateModal(false);
    setNewTemplateName('');
    alert('✅ Template saved!');
  };
  
  // Load template
  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setPlatforms(template.platforms);
      setHashtags(template.hashtags);
      setPreferences(template.preferences);
      setCurrentTemplate(templateId);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaFiles(prev => ({
        ...prev,
        [type]: {
          file,
          preview: event.target.result,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2), // MB
          type: file.type
        }
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Get video metadata
  const getVideoMetadata = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      video.src = URL.createObjectURL(file);
    });
  };
  
  // Enhance caption with AI (PHASE 1A: Now appends formatted hashtags)
  const enhanceWithAI = async () => {
    if (!originalCaption.trim()) {
      alert('Please enter a caption first');
      return;
    }
    
    setAiEnhancing(true);
    
    try {
      const hashtagArray = parseHashtags(hashtags);
      const hashtagString = hashtagArray.join(' ');
      
      // Group 1: Long-form platforms
      const group1Response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY_HERE', // User needs to replace this
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are a social media expert. Enhance this caption for Instagram Reels, TikTok, Threads, and Facebook (2200 char limit). Make it engaging with proven hooks, add relevant emojis, keep the core message. Do NOT include hashtags in your response - they will be added separately. Return ONLY the enhanced caption.\n\nOriginal: ${originalCaption}`
          }]
        })
      });
      
      const group1Data = await group1Response.json();
      const group1Enhanced = group1Data.content[0].text.trim() + (hashtagString ? '\n\n' + hashtagString : '');
      
      // Group 2: YouTube Shorts
      const group2Response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY_HERE',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Optimize this caption for YouTube Shorts (100 char limit including hashtags). Punchy, clear, keyword-rich. Return ONLY the optimized caption with hashtags: ${hashtagString}\n\nOriginal: ${originalCaption}`
          }]
        })
      });
      
      const group2Data = await group2Response.json();
      const group2Enhanced = group2Data.content[0].text.trim();
      
      setCaptions({
        group1: { ai: group1Enhanced, final: group1Enhanced },
        group2: { ai: group2Enhanced, final: group2Enhanced }
      });
      
    } catch (error) {
      console.error('AI Enhancement Error:', error);
      alert('Failed to enhance caption. Please check your API key and try again.');
    } finally {
      setAiEnhancing(false);
    }
  };
  
  // Video length validation
  const validateVideoLength = (platform, duration) => {
    const limits = {
      instagram: 90,
      tiktok: 600,
      threads: 300,
      facebook: 90,
      youtube: 60,
      linkedin: 600,
    };
    
    return duration <= limits[platform];
  };
  
  // Apply length to all platforms
  const handleLengthChange = (platform, length) => {
    if (applyLengthToAll) {
      const updated = {};
      Object.keys(platforms).forEach(p => {
        updated[p] = { ...platforms[p], length: parseInt(length) };
      });
      setPlatforms(updated);
    } else {
      setPlatforms(prev => ({
        ...prev,
        [platform]: { ...prev[platform], length: parseInt(length) }
      }));
    }
  };
  
  // Toggle platform
  const togglePlatform = (platform) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], enabled: !prev[platform].enabled }
    }));
  };
  
  // Submit to n8n (PHASE 1A: Now includes parsed hashtags)
  const handleSubmit = async () => {
    // Validation
    if (!originalCaption.trim()) {
      alert('Please enter a caption');
      return;
    }
    
    // PHASE 1A: Validate hashtags
    const hashtagArray = parseHashtags(hashtags);
    if (hashtagArray.length > 5) {
      alert(`Too many hashtags! You have ${hashtagArray.length}, maximum is 5. Please remove ${hashtagArray.length - 5} hashtag(s).`);
      return;
    }
    
    const enabledPlatforms = Object.entries(platforms)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
    
    if (enabledPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare payload
      const payload = {
        media: {
          video: mediaFiles.video,
          image: mediaFiles.image
        },
        originalCaption,
        hashtags: hashtagArray, // PHASE 1A: Parsed and validated hashtags
        hashtagsRaw: hashtags,
        captions: {
          group1: captions.group1.final || originalCaption,
          group2: captions.group2.final || originalCaption
        },
        platforms: enabledPlatforms.map(platform => ({
          name: platform,
          videoLength: platforms[platform].length,
          caption: ['instagram', 'tiktok', 'threads', 'facebook'].includes(platform) 
            ? captions.group1.final || originalCaption
            : captions.group2.final || originalCaption,
          hashtags: hashtagArray // Include hashtags per platform
        })),
        scheduling: {
          date: scheduling.date,
          time: scheduling.time,
          immediate: scheduling.postImmediately
        },
        timestamp: new Date().toISOString()
      };
      
      // Send to n8n webhook
      const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert('✅ Content queued successfully!');
        // Clear form
        setOriginalCaption('');
        setHashtags('');
        setCaptions({ group1: { ai: '', final: '' }, group2: { ai: '', final: '' } });
        setMediaFiles({ video: null, image: null });
      } else {
        alert('❌ Submission failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('❌ Error submitting content');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Best time suggestions
  const getBestTimeToPost = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '6-9 PM (evening engagement peak)';
    if (hour < 18) return '6-9 PM (evening engagement peak)';
    return '9-11 AM tomorrow (morning engagement peak)';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <img 
              src="./YT_banner_2.png"
              alt="DeepSquid AI Logo" 
              className="h-20 w-20 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-white">
                DeepSquid Content Logistics
              </h1>
              <p className="text-white/70 mt-2">Upload, enhance, and schedule your content across platforms</p>
            </div>
          </div>
        </div>

        {/* Saved Drafts */}
        {drafts.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Save className="w-5 h-5" /> Recent Drafts
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {drafts.slice(0, 3).map(draft => (
                <button
                  key={draft.id}
                  onClick={() => loadDraft(draft)}
                  className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-3 text-left transition-all"
                >
                  <div className="text-white/90 font-medium truncate">{draft.originalCaption.substring(0, 30)}...</div>
                  <div className="text-white/50 text-sm mt-1">{new Date(draft.timestamp).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Media Upload */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload Media
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Video Upload */}
            <div>
              <label className="block w-full">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 hover:border-white/50 transition-all cursor-pointer bg-white/5">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Video className="w-12 h-12 text-white/70 mx-auto mb-3" />
                    <p className="text-white/90 font-medium">Upload Video</p>
                    <p className="text-white/50 text-sm mt-1">.mp4, .mov, .avi</p>
                  </div>
                </div>
              </label>
              
              {mediaFiles.video && (
                <div className="mt-3 bg-white/5 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 font-medium truncate">{mediaFiles.video.name}</p>
                      <p className="text-white/60 text-sm">{mediaFiles.video.size} MB</p>
                    </div>
                    <button onClick={() => setMediaFiles(prev => ({ ...prev, video: null }))} className="text-red-400 hover:text-red-300">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block w-full">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 hover:border-white/50 transition-all cursor-pointer bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Image className="w-12 h-12 text-white/70 mx-auto mb-3" />
                    <p className="text-white/90 font-medium">Upload Image</p>
                    <p className="text-white/50 text-sm mt-1">.jpg, .png, .gif</p>
                  </div>
                </div>
              </label>
              
              {mediaFiles.image && (
                <div className="mt-3 bg-white/5 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 font-medium truncate">{mediaFiles.image.name}</p>
                      <p className="text-white/60 text-sm">{mediaFiles.image.size} MB</p>
                    </div>
                    <button onClick={() => setMediaFiles(prev => ({ ...prev, image: null }))} className="text-red-400 hover:text-red-300">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Original Caption */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">✍️ Original Caption</h2>
          
          <textarea
            value={originalCaption}
            onChange={(e) => setOriginalCaption(e.target.value)}
            placeholder="Write your caption here..."
            className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
          />
          
          <div className="mt-4">
            <label className="text-white/70 text-sm block mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" /> Hashtags (comma separated, max 5):
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="bondi, sunset, sydney, beach, australia"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            {/* PHASE 1A: Hashtag validation and character counting */}
            {(() => {
              const hashtagArray = parseHashtags(hashtags);
              const group1Chars = getTotalCharCount(originalCaption, hashtagArray);
              const group1Status = getCharStatus(group1Chars, platformLimits.group1);
              
              return (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    {hashtagArray.length > 5 ? (
                      <span className="text-red-400 text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {hashtagArray.length}/5 hashtags - Remove {hashtagArray.length - 5}
                      </span>
                    ) : (
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        hashtagArray.length === 0 ? 'text-white/50' : 
                        hashtagArray.length <= 3 ? 'text-green-400' :
                        hashtagArray.length <= 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {hashtagArray.length > 0 ? (
                          hashtagArray.length <= 5 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />
                        ) : null}
                        {hashtagArray.length}/5 hashtags {hashtagArray.length <= 5 && hashtagArray.length > 0 && '✅'}
                      </span>
                    )}
                    
                    {hashtagArray.length > 0 && (
                      <span className="text-white/50 text-sm">
                        Tags: {hashtagArray.join(' ')}
                      </span>
                    )}
                  </div>
                  
                  <span className={`text-sm font-medium ${group1Status.color}`}>
                    Final: {group1Chars}/{platformLimits.group1} chars (with hashtags)
                    {group1Status.status === 'good' && ' ✅'}
                    {group1Status.status === 'warning' && ' ⚠️'}
                    {group1Status.status === 'error' && ' ❌'}
                  </span>
                </div>
              );
            })()}
          </div>
          
          <button
            onClick={enhanceWithAI}
            disabled={aiEnhancing || !originalCaption.trim()}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            {aiEnhancing ? 'Enhancing with AI...' : '✨ Enhance with AI for All Platforms'}
          </button>
          
          <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>💡 Best time to post: {getBestTimeToPost()}</span>
          </div>
        </div>

        {/* Platform Captions */}
        {(captions.group1.ai || captions.group2.ai) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📱 Platform Captions (AI Enhanced)</h2>
            
            {/* Group 1: Long-form platforms */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 mb-3">
                <h3 className="text-white font-semibold mb-2">Group 1: Instagram • TikTok • Threads • Facebook</h3>
                <div className="flex items-center gap-4 text-sm">
                  {(() => {
                    const hashtagArray = parseHashtags(hashtags);
                    const totalChars = getTotalCharCount(captions.group1.final, hashtagArray);
                    const status = getCharStatus(totalChars, platformLimits.group1);
                    
                    return (
                      <>
                        <span className={`${status.color} font-medium flex items-center gap-1`}>
                          {status.icon && React.createElement(status.icon, { className: 'w-4 h-4' })}
                          {totalChars} / {platformLimits.group1} chars (with hashtags)
                        </span>
                        {totalChars > platformLimits.group1 && (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Will be trimmed by {totalChars - platformLimits.group1} chars
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {captions.group1.ai && (
                <div className="mb-3">
                  <label className="text-white/70 text-sm block mb-2">🤖 AI Enhanced:</label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-white/90 whitespace-pre-wrap">
                    {captions.group1.ai}
                  </div>
                </div>
              )}
              
              <label className="text-white/70 text-sm block mb-2">Edit for these platforms:</label>
              <textarea
                value={captions.group1.final}
                onChange={(e) => setCaptions(prev => ({
                  ...prev,
                  group1: { ...prev.group1, final: e.target.value }
                }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              />
            </div>

            {/* Group 2: YouTube Shorts */}
            <div>
              <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-lg p-4 mb-3">
                <h3 className="text-white font-semibold mb-2">Group 2: YouTube Shorts</h3>
                <div className="flex items-center gap-4 text-sm">
                  {(() => {
                    const hashtagArray = parseHashtags(hashtags);
                    const totalChars = getTotalCharCount(captions.group2.final, hashtagArray);
                    const status = getCharStatus(totalChars, platformLimits.group2);
                    
                    return (
                      <>
                        <span className={`${status.color} font-medium flex items-center gap-1`}>
                          {status.icon && React.createElement(status.icon, { className: 'w-4 h-4' })}
                          {totalChars} / {platformLimits.group2} chars (with hashtags)
                        </span>
                        {totalChars > platformLimits.group2 && (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Will be trimmed by {totalChars - platformLimits.group2} chars
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {captions.group2.ai && (
                <div className="mb-3">
                  <label className="text-white/70 text-sm block mb-2">🤖 AI Enhanced (optimized for YT):</label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-white/90 whitespace-pre-wrap">
                    {captions.group2.ai}
                  </div>
                </div>
              )}
              
              <label className="text-white/70 text-sm block mb-2">Edit for YouTube:</label>
              <textarea
                value={captions.group2.final}
                onChange={(e) => setCaptions(prev => ({
                  ...prev,
                  group2: { ...prev.group2, final: e.target.value }
                }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Platform Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">⚙️ Platform Settings</h2>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={applyLengthToAll}
                onChange={(e) => setApplyLengthToAll(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Apply same length to all platforms</span>
            </label>
          </div>
          
          <div className="space-y-3">
            {Object.entries(platforms).map(([platform, config]) => (
              <div key={platform} className="flex items-center gap-4 bg-white/5 rounded-lg p-4 border border-white/20">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={() => togglePlatform(platform)}
                  className="w-5 h-5"
                />
                <span className="text-white/90 font-medium capitalize flex-1">{platform}</span>
                <span className="text-white/60 text-sm">
                  Max: {platform === 'youtube' ? '60s' : platform === 'instagram' || platform === 'facebook' ? '90s' : platform === 'twitter' ? '140s' : '10m'}
                </span>
                <select
                  value={config.length}
                  onChange={(e) => handleLengthChange(platform, e.target.value)}
                  disabled={!config.enabled}
                  className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white disabled:opacity-50"
                >
                  {[15, 30, 45, 60, 90, 120].map(sec => (
                    <option key={sec} value={sec}>{sec}s</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Scheduling
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Date</label>
              <input
                type="date"
                value={scheduling.date}
                onChange={(e) => setScheduling(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Time
              </label>
              <input
                type="time"
                value={scheduling.time}
                onChange={(e) => setScheduling(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-white/90 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduling.postImmediately}
              onChange={(e) => setScheduling(prev => ({ ...prev, postImmediately: e.target.checked }))}
              className="w-4 h-4"
            />
            <span>Post Immediately</span>
          </label>
        </div>

        {/* Save Preferences & Templates */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Save className="w-5 h-5" /> Save Preferences
          </h2>
          
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.rememberPlatforms}
                onChange={(e) => setPreferences(prev => ({ ...prev, rememberPlatforms: e.target.checked }))}
                className="w-4 h-4"
              />
              <span>Remember my platform selection</span>
            </label>
            <label className="flex items-center gap-2 text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.rememberHashtags}
                onChange={(e) => setPreferences(prev => ({ ...prev, rememberHashtags: e.target.checked }))}
                className="w-4 h-4"
              />
              <span>Remember hashtag style</span>
            </label>
            <label className="flex items-center gap-2 text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoEnhance}
                onChange={(e) => setPreferences(prev => ({ ...prev, autoEnhance: e.target.checked }))}
                className="w-4 h-4"
              />
              <span>Auto-enhance with AI by default</span>
            </label>
          </div>
          
          <div className="flex gap-3">
            <select
              value={currentTemplate}
              onChange={(e) => loadTemplate(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="default">Default Profile</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Save as Template
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => saveDraft('manual')}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save as Draft
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || !originalCaption.trim()}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {submitting ? 'Submitting...' : 'Submit & Queue'}
          </button>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Save as Template</h3>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name (e.g., Personal Content)"
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepSquidContentForm;
