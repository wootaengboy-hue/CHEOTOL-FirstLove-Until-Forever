import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, X, LogIn, LogOut, Loader2, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth, storage } from "../firebase";
import { IPortfolioItem, INITIAL_PORTFOLIO } from "../constants/blogData";

const ADMIN_EMAIL = "wootaengboy@gmail.com";

const imageCompressionOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
};

export default function Portfolio() {
  const navigate = useNavigate();
  const [items, setItems] = useState<IPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isContentImageUploading, setIsContentImageUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IPortfolioItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "JAPAN",
    date: "",
    image: "",
    desc: "",
    content: ""
  });

  useEffect(() => {
    const q = query(collection(db, "portfolio"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both string and timestamp for legacy/new data
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      }) as IPortfolioItem[];
      
      setItems(fetchedItems.length > 0 ? fetchedItems : INITIAL_PORTFOLIO);
      setLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setItems(INITIAL_PORTFOLIO);
      setLoading(false);
    });

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === ADMIN_EMAIL);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

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
        const compressedFile = await imageCompression(file, imageCompressionOptions);
        setIsCompressing(false);
        const storageRef = ref(storage, `portfolio_content/${Date.now()}_${file.name}`);
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
    if (!isAdmin || !user) return;

    setIsUploading(true);
    try {
      let imageUrl = formData.image;

      if (selectedFile) {
        setIsCompressing(true);
        const compressedFile = await imageCompression(selectedFile, imageCompressionOptions);
        setIsCompressing(false);
        const storageRef = ref(storage, `portfolio/${Date.now()}_${selectedFile.name}`);
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

      const itemData = {
        title: formData.title,
        category: formData.category,
        date: formData.date,
        image: imageUrl,
        desc: formData.desc,
        content: formData.content,
      };

      if (editingItem) {
        const docRef = doc(db, "portfolio", editingItem.id);
        await updateDoc(docRef, {
          ...itemData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "portfolio"), {
          ...itemData,
          createdAt: serverTimestamp(),
          authorUid: user.uid
        });
      }
      setIsModalOpen(false);
      setSelectedFile(null);
      resetForm();
    } catch (error) {
      console.error("Error saving portfolio item:", error);
      alert("포트폴리오 저장 중 오류가 발생했습니다. 권한을 확인해주세요.");
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || !window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "portfolio", id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const openEditModal = (item: IPortfolioItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      date: item.date,
      image: item.image,
      desc: item.desc,
      content: item.content
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      category: "JAPAN",
      date: "",
      image: "",
      desc: "",
      content: ""
    });
  };

  const handleRestore = async () => {
    if (!isAdmin) return;
    try {
      for (const item of INITIAL_PORTFOLIO) {
        const { id, ...itemData } = item;
        await addDoc(collection(db, "portfolio"), {
          ...itemData,
          createdAt: serverTimestamp(),
          authorUid: user.uid
        });
      }
      alert("초기 포트폴리오가 복구되었습니다.");
    } catch (error) {
      console.error("Error restoring portfolio:", error);
    }
  };

  return (
    <div className="pt-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24 relative"
      >
        <h1 className="text-5xl md:text-7xl font-serif mb-8 tracking-tight">Portfolio</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-sans font-light">
          CHEOTOL이 함께한 수많은 인연의 기록, 그 찬란한 순간들입니다.
        </p>

        {/* Admin Controls */}
        <div className="mt-12 flex justify-center gap-4">
          {!user ? (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Admin Login
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <>
                  <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-accent-pink text-white rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:bg-accent-pink/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                  <button 
                    onClick={handleRestore}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
                  >
                    Restore Samples
                  </button>
                </>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-pink"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/portfolio/${item.id}`)}
              className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg group cursor-pointer relative"
            >
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-widest mb-2">{item.category}</span>
                <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                <p className="text-xs text-gray-300 font-sans font-light line-clamp-2">{item.desc}</p>
              </div>

              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => openEditModal(item, e)}
                    className="p-2 bg-white/90 rounded-full text-gray-900 hover:bg-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-serif">{editingItem ? "Edit Item" : "Add New Item"}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Title</label>
                      <input 
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans"
                        placeholder="Project Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans"
                      >
                        <option value="JAPAN">JAPAN</option>
                        <option value="VIETNAM">VIETNAM</option>
                        <option value="UZBEK">UZBEK</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Date</label>
                      <input 
                        required
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Image (Upload or URL)</label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="portfolio-image-upload"
                          />
                          <label 
                            htmlFor="portfolio-image-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-sans font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all"
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
                          value={formData.image}
                          onChange={e => setFormData({...formData, image: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans"
                          placeholder="Or paste an image URL here..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Short Description</label>
                    <textarea 
                      required
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans h-20 resize-none"
                      placeholder="Brief summary..."
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Full Content</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleContentImageUpload}
                          className="hidden"
                          id="portfolio-content-image-upload"
                          disabled={isContentImageUploading}
                        />
                        <label 
                          htmlFor="portfolio-content-image-upload"
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
                      required
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-accent-pink outline-none transition-all font-sans h-40 resize-none"
                      placeholder="Detailed story..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-sans font-bold uppercase tracking-widest text-xs hover:bg-accent-pink transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isCompressing ? "Compressing Image..." : `Uploading (${uploadProgress}%)...`}
                      </>
                    ) : (
                      editingItem ? "Update Item" : "Create Item"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
