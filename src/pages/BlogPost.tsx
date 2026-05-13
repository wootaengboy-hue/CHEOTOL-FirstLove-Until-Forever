import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Share2, Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, query, limit, getDocs, where } from "firebase/firestore";
import { INITIAL_POSTS, IBlogPost } from "../constants/blogData";

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<IBlogPost | null>(null);
  const [nextPost, setNextPost] = useState<IBlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const postData = { id: docSnap.id, ...docSnap.data() } as IBlogPost;
          setPost(postData);

          // Fetch next post from Firestore
          const q = query(collection(db, "posts"), limit(2));
          const querySnapshot = await getDocs(q);
          const otherPosts = querySnapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as IBlogPost))
            .filter(p => p.id !== id);
          
          if (otherPosts.length > 0) {
            setNextPost(otherPosts[0]);
          } else {
            // If no other posts in Firestore, show one from INITIAL_POSTS
            const fallbackNext = INITIAL_POSTS.find(p => p.id !== id);
            if (fallbackNext) setNextPost(fallbackNext);
          }
        } else {
          // Check INITIAL_POSTS fallback
          const fallbackPost = INITIAL_POSTS.find(p => p.id === id);
          if (fallbackPost) {
            setPost(fallbackPost);
            const fallbackNext = INITIAL_POSTS.find(p => p.id !== id);
            if (fallbackNext) setNextPost(fallbackNext);
          } else {
            setPost(null);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-pink"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-40 text-center font-serif text-2xl bg-[#F9F8F6] min-h-screen">
        Post not found.
        <button onClick={() => navigate('/blog')} className="block mx-auto mt-4 text-accent-pink text-sm font-sans uppercase tracking-widest">Back to Blog</button>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F8F6] min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-24 left-0 w-full z-40 px-6 md:px-[5%] flex justify-between items-center pointer-events-none">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/blog')}
          className="pointer-events-auto bg-white/80 backdrop-blur-md border border-gray-200 p-3 rounded-full hover:bg-white transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-accent-pink" />
        </motion.button>
        <div className="flex gap-3 pointer-events-auto">
          <button className="bg-white/80 backdrop-blur-md border border-gray-200 p-3 rounded-full hover:bg-white transition-all shadow-sm group">
            <Bookmark className="w-5 h-5 text-gray-600 group-hover:text-accent-pink" />
          </button>
          <button className="bg-white/80 backdrop-blur-md border border-gray-200 p-3 rounded-full hover:bg-white transition-all shadow-sm group">
            <Share2 className="w-5 h-5 text-gray-600 group-hover:text-accent-pink" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 px-6 md:px-[5%] max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] block">
            {post.category} — {post.date}
          </span>
          <h1 className="text-[8vw] sm:text-[6vw] md:text-5xl lg:text-7xl font-serif font-bold text-gray-900 leading-[1.1] md:leading-tight tracking-tight break-keep">
            {post.title}
          </h1>
        </motion.div>
      </header>

      {/* Hero Image */}
      <div className="px-6 md:px-[5%] max-w-6xl mx-auto mb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="rounded-[3rem] overflow-hidden shadow-2xl"
        >
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full aspect-[16/9] object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Article Content */}
      <article className="px-6 md:px-[5%] max-w-3xl mx-auto pb-32">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="prose prose-lg prose-gray max-w-none"
        >
          <div className="font-serif text-xl md:text-2xl text-gray-800 leading-relaxed whitespace-pre-line italic border-l-4 border-accent-pink/30 pl-8 mb-12">
            "우리는 단순히 국가를 연결하는 것이 아닙니다. <br />
            당신의 삶에 가장 아름다운 첫사랑의 기억을 다시 심어드리는 일입니다."
          </div>
          
          <div className="font-sans font-light text-lg md:text-xl text-gray-600 leading-[1.8] space-y-8 whitespace-pre-line">
            {post.content.split(/(\[\[IMAGE:.*?\]\])/).map((part, index) => {
              if (part.startsWith('[[IMAGE:') && part.endsWith(']]')) {
                const imageUrl = part.slice(8, -2);
                return (
                  <div key={index} className="my-12 rounded-3xl overflow-hidden shadow-lg">
                    <img 
                      src={imageUrl} 
                      alt="Content image" 
                      className="w-full h-auto object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        </motion.div>
      </article>

      {/* Next Post Section */}
      {nextPost && (
        <section className="border-t border-gray-200 bg-white py-32 px-6 md:px-[5%]">
          <div className="max-w-4xl mx-auto">
            <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-[0.4em] mb-12 block text-center">
              Next Story
            </span>
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => {
                navigate(`/blog/${nextPost.id}`);
                window.scrollTo(0, 0);
              }}
              className="group cursor-pointer text-center space-y-8"
            >
              <h2 className="text-[7vw] sm:text-[5vw] md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-[1.1] md:leading-tight group-hover:text-accent-pink transition-colors break-keep px-4">
                {nextPost.title}
              </h2>
              <div className="flex items-center justify-center gap-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">
                Read Next <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <footer className="py-20 bg-[#F9F8F6] text-center border-t border-gray-100">
        <button 
          onClick={() => navigate('/blog')}
          className="text-xs font-sans font-bold text-gray-400 uppercase tracking-[0.3em] hover:text-accent-pink transition-colors"
        >
          Back to Journal
        </button>
      </footer>
    </div>
  );
}
