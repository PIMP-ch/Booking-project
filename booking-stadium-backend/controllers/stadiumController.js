import Stadium from "../models/Stadiumm.js";
import BuildingRelation from "../models/BuildingRelation.js";
import Building from "../models/Buildingg.js";
import fs from "fs";
import path from "path";

// ✅ 1. เพิ่ม Stadium พร้อมรองรับการอัปโหลดรูปภาพหลายรูป
export const createStadium = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ถ้ามีการอัปโหลดไฟล์ผ่าน Multer (req.files) ให้เก็บ path ลงใน imageUrl
    if (req.files && req.files.length > 0) {
      payload.imageUrl = req.files.map(file => `/uploads/${file.filename}`);
    } else {
      payload.imageUrl = []; // ถ้าไม่มีรูปให้เป็น Array ว่าง
    }

    if (payload.buildingIds && !Array.isArray(payload.buildingIds)) {
      payload.buildingIds = [payload.buildingIds];
    }

    const newStadium = await Stadium.create(payload);
    await newStadium.save();

    // สร้างคสพกระหว่างสนามกับอาคาร

    const currentStadiumId = newStadium.id
    const allBuilding = await Building.findAll({ attributes: ['id'] });
    const allBuildingIds = allBuilding.map(item => item.id);
    const newBuildingIds = payload.buildingIds;

    allBuildingIds.forEach(buildingId => {
      BuildingRelation.create({
        stadiumId: currentStadiumId,
        buildingId: buildingId,
        active: newBuildingIds.includes(buildingId) ? '1' : '0'
      })
    })

    res.status(201).json({ message: "Stadium created successfully", stadium: newStadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const addStadiumImages = async (req, res) => {
  try {
    const { id } = req.params;
    let newImagePaths = [];

    // ส่วนที่ 1: ถ้าเลือกไฟล์จากเครื่อง (ไม่ว่าจะชื่ออะไร Multer จะเปลี่ยนชื่อให้ข้างต้น)
    if (req.files && req.files.length > 0) {
      newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
    }

    // ส่วนที่ 2: ถ้าก๊อปปี้ลิงก์รูปจากเน็ตมาวาง (รองรับ "จากไหนก็ได้")
    if (req.body.imageUrl) {
      const externalUrls = Array.isArray(req.body.imageUrl) ? req.body.imageUrl : [req.body.imageUrl];
      newImagePaths = [...newImagePaths, ...externalUrls];
    }

    if (newImagePaths.length === 0) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์หรือระบุ URL รูปภาพ" });
    }

    // const stadium = await Stadium.findByIdAndUpdate(
    //   id,
    //   { $push: { imageUrl: { $each: newImagePaths } } }, // เพิ่มรูปเข้าไปในอาเรย์เดิม
    //   { new: true }
    // );
    const stadium = await Stadium.findByPk(id);

    stadium.imageUrl = [
      ...(stadium.imageUrl || []),
      ...newImagePaths
    ];

    await stadium.save();

    res.status(200).json({ message: "เพิ่มรูปภาพสำเร็จ", stadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 3. ลบรูปภาพทีละรูป (ลบไฟล์ในเครื่อง + ลบใน Database)
export const deleteStadiumImage = async (req, res) => {
  try {
    const { id, index } = req.params;
    // const stadium = await Stadium.findById(id);
    const stadium = await Stadium.findByPk(id);


    if (!stadium || !stadium.imageUrl[index]) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ลบไฟล์จริงในเครื่อง (ใช้ path.join เพื่อหาที่อยู่ไฟล์)
    const fileName = stadium.imageUrl[index];

    // ลบไฟล์เฉพาะถ้า Path ขึ้นต้นด้วย /uploads (เป็นไฟล์ในเครื่อง)
    if (fileName.startsWith('/uploads')) {
      const filePath = path.join(process.cwd(), fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // ลบ Path ออกจาก Array ใน Database
    stadium.imageUrl.splice(index, 1);
    await stadium.save();

    res.status(200).json({ message: "Image deleted successfully", stadium });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};

// ✅ 4. อัปเดตข้อมูลทั่วไป (รองรับกรณี IsBooking)
export const updateStadium = async (req, res) => {
  try {
    const { id } = req.params;
    // const stadium = await Stadium.findById(id);
    const stadium = await Stadium.findByPk(id);

    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    const payload = { ...req.body };

    // ✅ ตรวจสอบและแปลง buildingIds ให้เป็น Array เสมอ
    if (payload.buildingIds) {
      payload.buildingIds = Array.isArray(payload.buildingIds)
        ? payload.buildingIds
        : [payload.buildingIds];
    }

    // ✅ กรณีสนามถูกจอง (IsBooking): ล็อกฟิลด์สำคัญ แต่ให้แก้ชื่อ/คำอธิบายได้
    if (stadium.dataValues.statusStadium === "IsBooking") {
      const allowedData = {
        nameStadium: payload.nameStadium || stadium.nameStadium,
        descriptionStadium: payload.descriptionStadium || stadium.descriptionStadium,
        contactStadium: payload.contactStadium || stadium.contactStadium,
      };

      const stadium = await Stadium.findByPk(id);

      await stadium.update(allowedData);
      return res.status(200).json({ message: "อัปเดตข้อมูลทั่วไปสำเร็จ (สถานะจองอยู่)", stadium: updated });
    }

    // ✅ กรณีปกติ: อัปเดตได้ทุกฟิลด์
    // const updatedStadium = await Stadium.findByIdAndUpdate(id, payload, { new: true });
    // const [_, [updatedStadium]] = await Stadium.update(payload, {
    //   where: { id },
    //   returning: true,
    // });
    await Stadium.update(payload, {
      where: { id },
    });
    const updatedStadium = await Stadium.findByPk(id);

    const currentStadiumId = id
    const allBuilding = await Building.findAll({ attributes: ['id'] });
    const allBuildingIds = allBuilding.map(item => item.id);
    const newBuildingIds = payload.buildingIds;
    allBuildingIds.forEach(buildingId => {
      BuildingRelation.update({
        active: newBuildingIds.includes(buildingId) ? '1' : '0'
      }, {
        where: {
          stadiumId: currentStadiumId,
          buildingId: buildingId
        }
      })
    })

    res.status(200).json({ message: "บันทึกการแก้ไขสำเร็จ", stadium: updatedStadium });

  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก", error: error.message });
  }
};

// ✅ 5. ดึงข้อมูลทั้งหมด
export const getStadiums = async (_req, res) => {
  try {
    const stadiums = await Stadium.findAll({
      include: [{
        model: BuildingRelation,
        as: 'buildingRelations',
        attributes: ['buildingId'], // เอาแค่ id
        where: { active: '1' }, // เอาเฉพาะ active
        required: false // กัน stadium ที่ไม่มี building แล้วหาย
      }],
      order: [['createdAt', 'DESC']]
    });

    const result = stadiums.map(stadium => {
      const data = stadium.toJSON();

      return {
        ...data,
        buildingIds: data.buildingRelations.map(b => b.buildingId) // ✅ ใช้ key ใหม่
      };
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ 6. ดึงข้อมูลตาม ID
// export const getStadiumById = async (req, res) => {
//   try {
//     const stadium = await Stadium.findByPk(req.params.id, {
//       include: [{
//         model: BuildingRelation,
//         as: 'buildingRelations',
//         attributes: ['buildingId'],
//         where: { active: '1' }, // 🔥 เอาเฉพาะ active
//         required: false // กันกรณีไม่มีแล้ว stadium หาย
//       }]
//     });

//     if (!stadium) {
//       return res.status(404).json({ message: 'Not found' });
//     }

//     console.log(stadium)

//     const { buildingRelations, ...rest } = stadium.toJSON();

//     console.log(buildingRelations)

//     const result = {
//       ...rest,
//       buildingIds: buildingRelations.map(item => item.buildingId) // ✅ array ล้วน
//     };

//     res.status(200).json(result);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'error' });
//   }
// };

export const getStadiumById = async (req, res) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id, {
      include: [{
        model: BuildingRelation,
        as: 'buildingRelations',
        attributes: ['buildingId'],
        where: { active: '1' },
        required: false,
        include: [{
          model: Building, // ✅ join Building เพื่อดึงชื่อ
          as: 'building',  // ชื่อ alias ที่ define ใน association
          attributes: ['id', 'name']
        }]
      }]
    });

    if (!stadium) {
      return res.status(404).json({ message: 'Not found' });
    }

    const { buildingRelations, ...rest } = stadium.toJSON();

    const result = {
      ...rest,
      buildings: buildingRelations.map(item => ({
        id: item.building.id,
        name: item.building.name
      }))
    };

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

// ✅ 7. ลบ Stadium ทิ้งทั้งหมด
export const deleteStadium = async (req, res) => {
  try {
    // const stadium = await Stadium.findById(req.params.id);
    const stadium = await Stadium.findByPk(req.params.id);

    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    if (stadium.statusStadium === "IsBooking") {
      return res.status(400).json({ message: "Cannot delete stadium under booking status" });
    }

    // ลบรูปภาพทั้งหมดที่เกี่ยวข้องใน Folder ทิ้งก่อนลบ Data
    stadium.imageUrl.forEach(imgPath => {
      const filePath = path.join(process.cwd(), imgPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Stadium.destroy({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: "Stadium and its images deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};