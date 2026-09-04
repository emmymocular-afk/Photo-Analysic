/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PresetImage {
  id: string;
  url: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  category: "real" | "ai" | "art";
}

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: "preset-real",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    titleVi: "Chân dung DSLR Thật",
    titleEn: "Authentic DSLR Portrait",
    descriptionVi: "Ảnh chụp sắc nét, chân thực với chi tiết lỗ chân lông rõ rệt và đổ bóng chuẩn vật lý.",
    descriptionEn: "A genuine studio camera capturing natural skin pores, realistic depth of field, and optical shadows.",
    category: "real"
  },
  {
    id: "preset-lowlight",
    url: "https://images.unsplash.com/photo-1520156542940-f1be6369dd44?auto=format&fit=crop&w=600&q=80",
    titleVi: "Chân dung Đêm (Nhiễu hạt Cao)",
    titleEn: "Low-Light Night Shot (High ISO Noise)",
    descriptionVi: "Ảnh chụp thiếu sáng có hạt nhiễu cảm biến đồng đều trên toàn khung, ánh sáng môi trường thực tế.",
    descriptionEn: "High-ISO camera capture with heavy uniform noise floor and complex realistic environmental lighting.",
    category: "real"
  },
  {
    id: "preset-group",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    titleVi: "Ảnh Nhóm Nhiều Người (Nén JPG)",
    titleEn: "Group Photo (JPEG Compressed)",
    descriptionVi: "Nhiều đối tượng với các sắc độ tiêu cự khác nhau, kiểm tra tính đồng đều về cấu trúc khuôn mặt thụ động.",
    descriptionEn: "Multiple subjects with focus gradients. Crucial for verifying non-distorted secondary human structures.",
    category: "real"
  },
  {
    id: "preset-ai",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    titleVi: "Chân dung Siêu Mịn màng (Nghi vấn AI)",
    titleEn: "Hyperrealistic Portrait (AI Suspect)",
    descriptionVi: "Góc chụp hoàn mỹ với làn da siêu mịn kiểu sáp mờ, ánh sáng phản chiếu cực kỳ đồng đều.",
    descriptionEn: "Highly polished lighting with virtual-like wax skin textures and ideal uniform reflections.",
    category: "ai"
  },
  {
    id: "preset-art",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    titleVi: "Bố cục Giả tưởng (Tạo từ AI)",
    titleEn: "Fantasy Concept Art (AI generated)",
    descriptionVi: "Phong cách giả tưởng siêu thực mượt mà chứa đựng nhiều chi tiết ánh sáng và hình thể phi lý.",
    descriptionEn: "A surreal, dreamy composition filled with physics-defying light details typical of creative generative systems.",
    category: "art"
  }
];
