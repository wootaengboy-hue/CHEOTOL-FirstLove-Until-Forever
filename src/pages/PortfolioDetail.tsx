import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import { doc, getDoc, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { IPortfolioItem, INITIAL_PORTFOLIO } from "../constants/blogData";

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<IPortfolioItem | null>(null);
  const [nextItem, setNextItem] = useState<IPortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Try Firestore first
        const docRef = doc(db, "portfolio", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as IPortfolioItem);
        } else {
          // Fallback to initial data
          const fallback = INITIAL_PORTFOLIO.find(p => p.id === id);
          if (fallback) {
            setItem(fallback);
          }
        }

        // Fetch next item for navigation
        const portfolioRef = collection(db, "portfolio");
        const q = query(portfolioRef, limit(2));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IPortfolioItem));
        
        let next = items.find(i => i.id !== id);
        if (!next) {
          next = INITIAL_PORTFOLIO.find(i => i.id !== id);
        }
        setNextItem(next || null);

      } catch (error) {
        console.error("Error fetching portfolio item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcf9]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-pink"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcf9] px-6 text-center">
        <h1 className="text-4xl font-serif mb-6">Portfolio item not found</h1>
        <button 
          onClick={() => navigate('/portfolio')}
          className="flex items-center gap-2 text-accent-pink font-sans font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fdfcf9] min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={item.image} 
          alt={item.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="flex items-center justify-center gap-4 text-xs font-sans font-bold uppercase tracking-[0.2em]">
              <span className="bg-accent-pink px-3 py-1 rounded-full">{item.category}</span>
              <span className="opacity-80">{item.date}</span>
            </div>
            <h1 className="text-[10vw] sm:text-[8vw] md:text-6xl lg:text-7xl font-serif leading-[1.1] md:leading-tight break-keep w-full px-4">
              {item.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6 md:px-[5%] max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="prose prose-lg max-w-none"
        >
          <div className="flex items-center gap-8 mb-12 pb-12 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-sans font-bold uppercase tracking-widest">{item.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Tag className="w-4 h-4" />
              <span className="text-xs font-sans font-bold uppercase tracking-widest">{item.category}</span>
            </div>
          </div>

          <div className="text-xl md:text-2xl font-serif text-gray-800 leading-relaxed mb-12 italic">
            {item.desc}
          </div>

          <div className="text-lg text-gray-700 leading-loose font-sans font-light whitespace-pre-line">
            {item.content.split(/(\[\[IMAGE:.*?\]\])/).map((part, index) => {
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

        {/* Navigation */}
        <div className="mt-24 pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-12">
          <button 
            onClick={() => navigate('/portfolio')}
            className="group flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-sans font-bold uppercase tracking-widest">All Work</span>
          </button>

          {nextItem && (
            <button 
              onClick={() => navigate(`/portfolio/${nextItem.id}`)}
              className="group flex items-center gap-6 text-right"
            >
              <div className="hidden md:block">
                <p className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-[0.2em] mb-2">Next Project</p>
                <h4 className="text-lg md:text-xl font-serif text-gray-900 group-hover:text-accent-pink transition-colors break-keep max-w-[200px] md:max-w-[400px] leading-snug">
                  {nextItem.title}
                </h4>
              </div>
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white group-hover:bg-accent-pink transition-colors">
                <ArrowRight className="w-6 h-6" />
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 md:px-[5%] bg-[#f4f0e6] text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif text-gray-900">당신만의 특별한 인연을<br />찾아드릴 준비가 되어 있습니다.</h2>
          <button 
            onClick={() => navigate('/contact')}
            className="px-12 py-5 bg-gray-900 text-white rounded-full font-sans font-bold uppercase tracking-widest text-xs hover:bg-accent-pink transition-all"
          >
            Start Your Journey
          </button>
        </div>
      </section>
    </div>
  );
}
