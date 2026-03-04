import { useEffect, useState } from 'react';
import { db, type ReferenceImage } from '../db/database';
import { ImagePlus, Grid, List, X, Trash2, FolderPlus } from 'lucide-react';

const categories = ['全部', '佛像', '曼陀罗', '纹样', '配色', '其他'];

export function Gallery() {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('其他');
  
  useEffect(() => {
    loadImages();
  }, []);
  
  async function loadImages() {
    const data = await db.referenceImages.toArray();
    setImages(data.sort((a, b) => b.createdAt - a.createdAt));
  }
  
  async function handleAddImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async () => {
          const image: ReferenceImage = {
            id: crypto.randomUUID(),
            name: file.name,
            category: newCategory,
            imageData: reader.result as string,
            createdAt: Date.now(),
          };
          await db.referenceImages.add(image);
          await loadImages();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
  
  async function handleDelete(id: string) {
    if (confirm('确定删除这张参考图吗？')) {
      await db.referenceImages.delete(id);
      setSelectedImage(null);
      await loadImages();
    }
  }
  
  const filteredImages = selectedCategory === '全部'
    ? images
    : images.filter(img => img.category === selectedCategory);
  
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">参考图库</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-tangka-sand rounded-xl transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="p-2 bg-tangka-red text-white rounded-xl"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* 分类标签 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-colors
                ${selectedCategory === cat
                  ? 'bg-tangka-red text-white'
                  : 'bg-tangka-sand text-tangka-brown'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* 添加图片对话框 */}
        {isAdding && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">添加参考图</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-1 hover:bg-tangka-sand rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">选择分类</label>
                <div className="flex gap-2 flex-wrap">
                  {categories.slice(1).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm
                        ${newCategory === cat
                          ? 'bg-tangka-red text-white'
                          : 'bg-tangka-sand'
                        }
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddImage}
                className="w-full py-3 border-2 border-dashed border-tangka-sand rounded-xl
                           flex items-center justify-center gap-2 text-tangka-brown/60
                           hover:border-tangka-red hover:text-tangka-red transition-colors"
              >
                <FolderPlus className="w-5 h-5" />
                选择图片
              </button>
            </div>
          </div>
        )}
        
        {/* 图片网格 */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImagePlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>暂无参考图</p>
            <p className="text-sm mt-1">点击右上角添加</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredImages.map(img => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="aspect-square rounded-xl overflow-hidden bg-tangka-sand/30
                           cursor-pointer group relative"
              >
                <img
                  src={img.imageData}
                  alt={img.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredImages.map(img => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="card flex items-center gap-3 cursor-pointer"
              >
                <img
                  src={img.imageData}
                  alt={img.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium truncate">{img.name}</p>
                  <span className="text-xs text-tangka-red bg-tangka-red/10 px-2 py-0.5 rounded-full">
                    {img.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 大图查看 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage.imageData}
              alt={selectedImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(selectedImage.id);
                }}
                className="p-3 bg-red-500 text-white rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
