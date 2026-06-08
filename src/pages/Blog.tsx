import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Plus, Edit2, Trash2, LogIn, LogOut, X, Image as ImageIcon, Type, Calendar as CalendarIcon, Tag, AlignLeft, FileText, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { compressImage } from "../utils/imageCompressor";
import { db, auth, signInWithGoogle, logout, storage } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { INITIAL_POSTS, IBlogPost as BlogPost } from "../constants/blogData";

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canPostBlog, setCanPostBlog] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isContentImageUploading, setIsContentImageUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const [formData, setFormData] = useState({
    category: "JOURNEY",
    title: "",
    date: new Date().toISOString().split('T')[0],
    image: "",
    desc: "",
    content: "",
    featured: false
  });

  const ADMIN_EMAIL = "wootaengboy@gmail.com";

  const handleRestore = async () => {
    if (!(isAdmin || canPostBlog) || !user) return;
    if (window.confirm("기존의 5개 포스트를 복구하시겠습니까?")) {
      try {
        for (const post of INITIAL_POSTS) {
          const { id, ...postData } = post;
          await addDoc(collection(db, "posts"), {
            ...postData,
            authorUid: user.uid,
            createdAt: serverTimestamp()
          });
        }
        alert("복구가 완료되었습니다!");
      } catch (error) {
        console.error("Error restoring posts:", error);
      }
    }
  };

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(currentUser.email === ADMIN_EMAIL);
        setCanPostBlog(currentUser.email === ADMIN_EMAIL);
        
        const userRef = doc(db, "users", currentUser.uid);
        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsAdmin(data.isAdmin || currentUser.email === ADMIN_EMAIL);
            setCanPostBlog(data.canPostBlog || data.isAdmin || currentUser.email === ADMIN_EMAIL);
          } else {
            const isRoot = currentUser.email === ADMIN_EMAIL;
            setIsAdmin(isRoot);
            setCanPostBlog(isRoot);
          }
        }, (error) => {
          console.error("Error reading user permissions in Blog.tsx:", error);
        });
      } else {
        setIsAdmin(false);
        setCanPostBlog(false);
        if (unsubUserDoc) {
          unsubUserDoc();
          unsubUserDoc = null;
        }
      }
    });

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both string and timestamp for legacy/new data
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      }) as BlogPost[];
      
      const dbTitles = new Set(fetchedPosts.map(p => p.title));
      const filteredSamples = INITIAL_POSTS.filter(p => !dbTitles.has(p.title));
      setPosts([...fetchedPosts, ...filteredSamples]);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setPosts(INITIAL_POSTS);
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        category: post.category,
        title: post.title,
        date: post.date,
        image: post.image,
        desc: post.desc,
        content: post.content,
        featured: post.featured
      });
    } else {
      setEditingPost(null);
      setFormData({
        category: "JOURNEY",
        title: "",
        date: new Date().toISOString().split('T')[0],
        image: "",
        desc: "",
        content: "",
        featured: false
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setIsContentImageUploading(true);
      setIsCompressing(true);
      try {
        const compressedFile = await compressImage(file);
        setIsCompressing(false);
        const storageRef = ref(storage, `blog_content/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            }, 
            (error) => reject(error), 
            () => resolve(null)
          );
        });

        const url = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Insert image tag into content
        const imageTag = `\n[[IMAGE:${url}]]\n`;
        setFormData(prev => ({
          ...prev,
          content: prev.content + imageTag
        }));
      } catch (error) {
        console.error("Error uploading content image:", error);
        alert("Failed to upload image. Please try a smaller file.");
      } finally {
        setIsContentImageUploading(false);
        setIsCompressing(false);
      }
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(isAdmin || canPostBlog) || !user) return;

    setIsUploading(true);
    try {
      let imageUrl = formData.image;

      if (selectedFile) {
        setIsCompressing(true);
        const compressedFile = await compressImage(selectedFile);
        setIsCompressing(false);
        const storageRef = ref(storage, `blog/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            }, 
            (error) => reject(error), 
            () => resolve(null)
          );
        });

        imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }

      const postData = {
        category: formData.category,
        title: formData.title,
        date: formData.date,
        image: imageUrl,
        desc: formData.desc,
        content: formData.content,
        featured: formData.featured,
        authorUid: user.uid,
      };

      if (editingPost) {
        await updateDoc(doc(db, "posts", editingPost.id), {
          ...postData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("포스트 저장 중 오류가 발생했습니다. 권한을 확인해주세요.");
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(isAdmin || canPostBlog)) return;
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, "posts", id));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = ["ALL", "JOURNEY", "VALUES", "TIPS", "STORY", "CULTURE"];

  // Filter posts by selectedCategory if it's not "ALL"
  const filteredPosts = selectedCategory === "ALL" 
    ? posts 
    : posts.filter(p => (p.category || "").toUpperCase() === selectedCategory.toUpperCase());

  // Determine featured post (first featured post in general, or fallback to first filtered post)
  const featuredPost = selectedCategory === "ALL" 
    ? (posts.find(p => p.featured) || posts[0])
    : (filteredPosts.find(p => p.featured) || filteredPosts[0]);

  // Regular posts are those in filteredPosts excluding the active featured post
  const regularPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-pink"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-[#F9F8F6]">
      <div className="px-6 md:px-[5%] max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-200 pb-12"
          >
            <div className="max-w-2xl">
              <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] mb-4 block">
                Journal & Stories
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight tracking-tighter sm:whitespace-nowrap">
                MEMOIR OF <span className="italic text-accent-pink/80 font-light">'첫올'</span>
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                {(isAdmin || canPostBlog) ? (
                  <>
                    <button 
                      onClick={() => handleOpenModal()}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-full font-sans font-bold text-xs uppercase tracking-widest hover:bg-accent-pink hover:text-gray-900 transition-all shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Add Post
                    </button>
                    <button 
                      onClick={handleRestore}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#eae8e4] text-gray-800 rounded-full font-sans font-bold text-xs uppercase tracking-widest hover:bg-accent-pink hover:text-gray-900 transition-all shadow-md"
                    >
                      Restore Initial Posts
                    </button>
                    <button 
                      onClick={logout}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 text-gray-600 rounded-full font-sans font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={signInWithGoogle}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 text-gray-600 rounded-full font-sans font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    <LogIn className="w-4 h-4" /> Admin Login
                  </button>
                )}
              </div>
            </div>
            <div className="max-w-xs">
              <p className="text-gray-500 font-sans font-light leading-relaxed text-base md:text-lg">
                인연, 사랑, 그리고 삶에 대한 깊은 생각들을 기록합니다. 
                우리가 만난 수많은 진심의 조각들을 이곳에 담았습니다.
              </p>
            </div>
          </motion.div>
        </header>

        {/* Category Filter Tabs */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200/60 pb-4 gap-4 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-2 sm:gap-4 flex-nowrap overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                      : "bg-[#F3F1ED] text-gray-500 hover:text-gray-900 hover:bg-[#eae8e4]"
                  }`}
                >
                  {cat === "ALL" ? "전체 포스팅 (ALL)" : cat}
                </button>
              ))}
            </div>
            {selectedCategory !== "ALL" && (
              <button
                onClick={() => setSelectedCategory("ALL")}
                className="flex-shrink-0 text-xs font-sans font-bold text-accent-pink uppercase tracking-widest hover:underline transition-all flex items-center gap-1 self-end sm:self-center"
              >
                전체보기로 돌아가기 &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => navigate(`/blog/${featuredPost.id}`)}
            className="mb-32 group cursor-pointer"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 overflow-hidden rounded-[2rem]">
                <motion.img 
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.8 }}
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  className="w-full aspect-[16/10] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-widest border border-accent-pink/30 px-3 py-1 rounded-full">
                    {featuredPost.category}
                  </span>
                  <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">
                    {featuredPost.date}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-tight group-hover:text-accent-pink transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-500 font-sans font-light text-lg leading-relaxed">
                  {featuredPost.desc}
                </p>
                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-gray-900 group-hover:gap-4 transition-all">
                    Read Full Story <ArrowRight className="w-4 h-4" />
                  </div>
                  {(isAdmin || canPostBlog) && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenModal(featuredPost)}
                        className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(featuredPost.id)}
                        className="p-3 bg-white border border-gray-200 rounded-full hover:bg-red-50 text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Post Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {regularPosts.map((post, idx) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="group cursor-pointer"
            >
              <div className="overflow-hidden rounded-[2rem] mb-8">
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                  src={post.image} 
                  alt={post.title}
                  className="w-full aspect-[4/5] md:aspect-square object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-sans font-bold text-accent-pink uppercase tracking-widest">
                    {post.category}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest">
                    {post.date}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 leading-tight group-hover:text-accent-pink transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-500 font-sans font-light text-sm leading-relaxed line-clamp-2">
                  {post.desc}
                </p>
                {(isAdmin || canPostBlog) && (
                  <div className="pt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenModal(post)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        {/* Admin Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9F8F6]">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">
                      {editingPost ? "Edit Memoir" : "New Memoir"}
                    </h2>
                    <p className="text-xs font-sans text-gray-400 uppercase tracking-widest mt-1">
                      Share a new story with the world
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-all"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                        <Tag className="w-3 h-3" /> Category
                      </label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-sans text-sm"
                      >
                        <option value="JOURNEY">JOURNEY</option>
                        <option value="VALUES">VALUES</option>
                        <option value="TIPS">TIPS</option>
                        <option value="STORY">STORY</option>
                        <option value="CULTURE">CULTURE</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                        <CalendarIcon className="w-3 h-3" /> Date
                      </label>
                      <input 
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-sans text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                      <Type className="w-3 h-3" /> Title
                    </label>
                    <input 
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter a captivating title..."
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-serif text-xl font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                      <ImageIcon className="w-3 h-3" /> Image (Upload or URL)
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="blog-image-upload"
                        />
                        <label 
                          htmlFor="blog-image-upload"
                          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-sans font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all"
                        >
                          {selectedFile ? selectedFile.name : "Choose File"}
                        </label>
                        {selectedFile && (
                          <button 
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-[10px] font-sans font-bold uppercase tracking-widest text-red-500"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input 
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        placeholder="Or paste an image URL here..."
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-sans text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                      <AlignLeft className="w-3 h-3" /> Short Description
                    </label>
                    <textarea 
                      value={formData.desc}
                      onChange={(e) => setFormData({...formData, desc: e.target.value})}
                      placeholder="A brief summary for the grid view..."
                      rows={2}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-sans text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                        <FileText className="w-3 h-3" /> Full Content
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleContentImageUpload}
                          className="hidden"
                          id="content-image-upload"
                          disabled={isContentImageUploading}
                        />
                        <label 
                          htmlFor="content-image-upload"
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-sans font-bold text-[9px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          {isContentImageUploading ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span className="lowercase font-normal opacity-60">
                                {isCompressing ? "compressing..." : `uploading ${uploadProgress}%`}
                              </span>
                            </div>
                          ) : (
                            <ImageIcon className="w-3 h-3" />
                          )}
                          {!isContentImageUploading && "Insert Image"}
                        </label>
                      </div>
                    </div>
                    <textarea 
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Write the full story here..."
                      rows={10}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-pink/20 font-sans text-base leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <input 
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="w-5 h-5 rounded accent-accent-pink"
                    />
                    <label htmlFor="featured" className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-gray-600 cursor-pointer">
                      <Star className={`w-4 h-4 ${formData.featured ? 'fill-accent-pink text-accent-pink' : 'text-gray-400'}`} /> Featured Post
                    </label>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-5 bg-gray-900 text-white rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-sm hover:bg-accent-pink hover:text-gray-900 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isCompressing ? "Compressing Image..." : `Uploading (${uploadProgress}%)...`}
                        </>
                      ) : (
                        editingPost ? "Update Memoir" : "Publish Memoir"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


      </div>
    </div>
  );
}
