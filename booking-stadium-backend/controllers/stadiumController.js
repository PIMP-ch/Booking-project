import Stadium from "../models/Stadiumm.js";
import StadiumImage from "../models/StadiumImage.js"; // ✅ import ใหม่
import BuildingRelation from "../models/BuildingRelation.js";
import Building from "../models/Buildingg.js";
import fs from "fs";
import path from "path";
import SportCategory from "../models/sportCategory.js";

// Helper: include images ใช้ซ้ำทุก query
const includeImages = {
  model: StadiumImage,
  as: "images",
  attributes: ["id", "url"],
};

// Helper: แปลง stadium object → เพิ่ม imageUrl เป็น array
const formatStadium = (stadium) => {
  const data = stadium.toJSON();
  return {
    ...data,
    imageUrl: (data.images || []).map((img) => img.url), // ✅ array of url
    images: undefined, // ซ่อน raw images ออก (optional)
  };
};

// ─────────────────────────────────────────────
// 1. สร้าง Stadium + รูปภาพ
// ─────────────────────────────────────────────
export const createStadium = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ✅ map sportTypeId → sportType
    if (payload.sportTypeId !== undefined) {
      payload.sportType = payload.sportTypeId ? Number(payload.sportTypeId) : null;
      delete payload.sportTypeId;
    }

    if (payload.buildingIds && !Array.isArray(payload.buildingIds)) {
      payload.buildingIds = [payload.buildingIds];
    }

    const newStadium = await Stadium.create(payload);

    const imagePaths = req.files?.map((file) => `/uploads/stadiums/${file.filename}`) || [];
    if (imagePaths.length > 0) {
      await StadiumImage.bulkCreate(
        imagePaths.map((url) => ({ stadiumId: newStadium.id, url }))
      );
    }

    const allBuilding = await Building.findAll({ attributes: ["id"] });
    const allBuildingIds = allBuilding.map((item) => item.id);
    const newBuildingIds = (payload.buildingIds || []).map(Number);

    await Promise.all(
      allBuildingIds.map((buildingId) =>
        BuildingRelation.create({
          stadiumId: newStadium.id,
          buildingId,
          active: newBuildingIds.includes(Number(buildingId)),
        })
      )
    );

    res.status(201).json({ message: "Stadium created successfully", stadium: newStadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. เพิ่มรูปให้ Stadium
// ─────────────────────────────────────────────
export const addStadiumImages = async (req, res) => {
  try {
    const { id } = req.params;

    const stadium = await Stadium.findByPk(id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    let newImagePaths = [];

    if (req.files?.length > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const invalidFiles = req.files.filter(
        (file) => !allowedTypes.includes(file.mimetype)
      );
      if (invalidFiles.length > 0) {
        return res.status(400).json({ message: "รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น" });
      }
      newImagePaths = req.files.map((file) => `/uploads/stadiums/${file.filename}`);
    }

    if (req.body.imageUrl) {
      const externalUrls = Array.isArray(req.body.imageUrl)
        ? req.body.imageUrl
        : [req.body.imageUrl];
      newImagePaths = [...newImagePaths, ...externalUrls];
    }

    if (newImagePaths.length === 0) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์หรือระบุ URL รูปภาพ" });
    }

    // ✅ upsert แทน bulkCreate — ถ้ามี url อยู่แล้วให้ set active = 1, ถ้าไม่มีค่อยสร้างใหม่
    await Promise.all(
      newImagePaths.map((url) =>
        StadiumImage.upsert({ stadiumId: id, url, active: "1" })
      )
    );

    // ✅ set active = 0 สำหรับรูปที่ไม่ได้ส่งมา (ถือว่าถูกลบออก)
    await StadiumImage.update(
      { active: "0" },
      {
        where: {
          stadiumId: id,
          url: { [Op.notIn]: newImagePaths },
        },
      }
    );

    const images = await StadiumImage.findAll({
      where: { stadiumId: id, active: "1" },
    });

    res.status(200).json({
      message: `อัปเดตรูปภาพสำเร็จ`,
      imageUrl: images.map((img) => img.url),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. ลบรูปภาพทีละรูป (ใช้ imageId แทน index)
// ─────────────────────────────────────────────
export const deleteStadiumImage = async (req, res) => {
  try {
    const { imageId } = req.params; // ✅ ใช้ id ของ StadiumImage แทน index

    const image = await StadiumImage.findByPk(imageId);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // ลบไฟล์จริงในเครื่อง
    // if (image.url.startsWith("/uploads")) {
    if (image.url.startsWith("/uploads/stadiums")) {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await image.destroy();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 4. อัปเดต Stadium
// ─────────────────────────────────────────────
export const updateStadium = async (req, res) => {
  try {
    const { id } = req.params;
    const stadium = await Stadium.findByPk(id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    const payload = { ...req.body };

    // ✅ map sportTypeId → sportType
    if (payload.sportTypeId !== undefined) {
      payload.sportType = payload.sportTypeId ? Number(payload.sportTypeId) : null;
      delete payload.sportTypeId;
    }

    if (payload.buildingIds) {
      payload.buildingIds = Array.isArray(payload.buildingIds)
        ? payload.buildingIds
        : [payload.buildingIds];
    }

    if (stadium.dataValues.statusStadium === "IsBooking") {
      const allowedData = {
        nameStadium: payload.nameStadium || stadium.nameStadium,
        descriptionStadium: payload.descriptionStadium || stadium.descriptionStadium,
        contactStadium: payload.contactStadium || stadium.contactStadium,
      };
      await stadium.update(allowedData);
      return res.status(200).json({
        message: "อัปเดตข้อมูลทั่วไปสำเร็จ (สถานะจองอยู่)",
        stadium,
      });
    }

    await Stadium.update(payload, { where: { id } });

    if (payload.buildingIds !== undefined) {
      const allBuilding = await Building.findAll({ attributes: ["id"] });
      const allBuildingIds = allBuilding.map((item) => item.id);
      const newBuildingIds = payload.buildingIds.map(Number);

      await Promise.all(
        allBuildingIds.map((buildingId) =>
          BuildingRelation.update(
            { active: newBuildingIds.includes(Number(buildingId)) },
            { where: { stadiumId: id, buildingId } }
          )
        )
      );
    }

    if (payload.imageUrls !== undefined) {
      const newImageUrls = Array.isArray(payload.imageUrls)
        ? payload.imageUrls
        : [payload.imageUrls];

      if (newImageUrls.length > 0) {
        await StadiumImage.update(
          { active: true },
          { where: { stadiumId: id, url: { [Op.in]: newImageUrls } } }
        );
      }

      await StadiumImage.update(
        { active: false },
        { where: { stadiumId: id, url: { [Op.notIn]: newImageUrls } } }
      );
    }

    const updatedStadium = await Stadium.findByPk(id, { include: [includeImages] });

    res.status(200).json({
      message: "บันทึกการแก้ไขสำเร็จ",
      stadium: formatStadium(updatedStadium),
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 5. ดึงข้อมูลทั้งหมด
// ─────────────────────────────────────────────
export const getStadiums = async (_req, res) => {
  try {
    const stadiums = await Stadium.findAll({
      include: [
        includeImages, // ✅ ดึงรูปมาด้วย
        {
          model: BuildingRelation,
          as: "buildingRelations",
          attributes: ["buildingId"],
          where: { active: "1" },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = stadiums.map((stadium) => {
      const data = formatStadium(stadium);
      return {
        ...data,
        buildingIds: (data.buildingRelations || []).map((b) => b.buildingId),
        buildingRelations: undefined,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 6. ดึงข้อมูลตาม ID
// ─────────────────────────────────────────────
export const getStadiumById = async (req, res) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id, {
      include: [
        includeImages, // ✅ ดึงรูปมาด้วย
        {
          model: BuildingRelation,
          as: "buildingRelations",
          attributes: ["buildingId"],
          where: { active: "1" },
          required: false,
          include: [{
            model: Building,
            as: "building",
            attributes: ["id", "name"],
          }],
        },
      ],
    });

    if (!stadium) return res.status(404).json({ message: "Not found" });

    const { buildingRelations, ...rest } = formatStadium(stadium);

    const result = {
      ...rest,
      buildings: (buildingRelations || []).map((item) => ({
        id: item.building.id,
        name: item.building.name,
      })),
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 7. ลบ Stadium ทั้งหมด
// ─────────────────────────────────────────────
export const deleteStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id, { include: [includeImages] });
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    if (stadium.statusStadium === "IsBooking") {
      return res.status(400).json({ message: "Cannot delete stadium under booking status" });
    }

    // ✅ ลบไฟล์รูปทั้งหมดก่อน (จาก StadiumImage)
    const images = await StadiumImage.findAll({ where: { stadiumId: req.params.id } });
    images.forEach((img) => {
      // if (img.url.startsWith("/uploads")) {
      if (img.url.startsWith("/uploads/stadiums")) {
        const filePath = path.join(process.cwd(), img.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    // CASCADE จะลบ StadiumImage ให้อัตโนมัติเพราะ onDelete: "CASCADE"
    await Stadium.destroy({ where: { id: req.params.id } });

    res.status(200).json({ message: "Stadium and its images deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// 8. ดึงประเภทกีฬา
// ─────────────────────────────────────────────
export const sportTypes = async (req, res) => {
  try {
    const sportCategories = await SportCategory.findAll();
    res.status(200).json(sportCategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};