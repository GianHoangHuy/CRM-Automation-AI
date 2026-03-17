const Product = require('../models/Product');
const Category = require('../models/Category');

// Xem danh mục sản phẩm, tìm kiếm, lọc, sắp xếp, phân trang
const getProducts = async(req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            minRating,
            search,
            sort = 'createdAt_desc',
            brand,
            page = 1,
            limit = 20
        } = req.query;

        const pageNum = Math.max(parseInt(page), 1);
        const pageSize = Math.min(Math.max(parseInt(limit), 1), 100);
        const filter = {};

        if (category) {
            try {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                if (isObjectId) {
                    filter.category = category;
                } else {
                    const cat = await Category.findOne({ slug: category });
                    if (cat) filter.category = cat._id;
                    else {
                        return res.json({
                            data: [],
                            meta: { total: 0, totalPages: 0, page: pageNum, limit: pageSize }
                        });
                    }
                }
            } catch (err) {
                console.error("Category error:", err);
            }
        }

        if (brand) filter.brand = brand;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (minRating) filter.rating = { $gte: Number(minRating) };

        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { name: regex },
                { slug: regex }
            ];
        }

        const [field, order] = sort.split('_');
        const sortOption = {};
        const dir = order === 'asc' ? 1 : -1;

        const allowedSortFields = ['price', 'createdAt', 'rating', 'name'];
        sortOption[allowedSortFields.includes(field) ? field : 'createdAt'] = dir;

        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / pageSize);

        const products = await Product.find(filter)
            .select('name slug price images brand rating numReviews')
            .sort(sortOption)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        return res.json({
            data: products,
            meta: {
                total,
                totalPages,
                page: pageNum,
                limit: pageSize,
                hasNextPage: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error("Catalog Error:", error);
        return res.status(500).json({ message: 'Lỗi server khi hiển thị trang danh mục sản phẩm' });
    }
};


// Trang chi tiết sản phẩm
const getProductByIdOrSlug = async(req, res) => {
    try {
        const { idOrSlug } = req.params;
        let product;

        if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
            product = await Product.findById(idOrSlug).populate('category', 'name slug').lean();
        } else {
            product = await Product.findOne({ slug: idOrSlug }).populate('category', 'name slug').lean();
        }

        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        return res.json(product);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xem chi tiết sản phẩm' });
    }
};

// Trang chủ
const getHomeProducts = async(req, res) => {
    try {
        const newest = await Product.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name slug price images brand rating numReviews');

        const bestSellers = await Product.find()
            .sort({ numReviews: -1 })
            .limit(10)
            .select('name slug price images brand rating numReviews');

        const categories = await Category.find({ slug: { $in: ['dien-thoai', 'laptop', 'phu-kien'] } });
        const byCategory = {};
        for (const cat of categories) {
            const products = await Product.find({ category: cat._id })
                .sort({ createdAt: -1 })
                .limit(6)
                .select('name slug price images brand rating numReviews');
            byCategory[cat.slug] = { category: cat, products };
        }

        return res.json({
            newest,
            bestSellers,
            categories: byCategory
        });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi hiển thị trang chủ' })
    }
}

module.exports = {
    getProducts,
    getProductByIdOrSlug,
    getHomeProducts
};