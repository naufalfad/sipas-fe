import * as z from 'zod';

export const applicantSchema = z.object({
  type: z.enum(['PERORANGAN', 'BADAN_USAHA']),
  name: z.string().min(3, 'Nama wajib diisi'),
  nik: z.string().optional(),
  nib: z.string().optional(),
  npwp: z.string().min(5, 'NPWP wajib diisi'),
  directorName: z.string().optional(),
  phone: z.string().min(9, 'Nomor Telepon wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  address: z.string().min(10, 'Alamat lengkap wajib diisi'),
});

export const submissionDataSchema = z.object({
  submissionType: z.enum(['BARU', 'REVISI', 'PERPANJANGAN']),
  activityName: z.string().min(5, 'Nama kegiatan/pembangunan wajib diisi'),
});

export const locationSchema = z.object({
  locationName: z.string().min(3, 'Nama lokasi wajib diisi'),
  village: z.string().min(3, 'Desa/Kelurahan wajib diisi'),
  district: z.string().min(3, 'Kecamatan wajib diisi'),
  city: z.string().min(3, 'Kabupaten/Kota wajib diisi'),
  province: z.string().min(3, 'Provinsi wajib diisi'),
  fullAddress: z.string().min(10, 'Alamat lengkap wajib diisi'),
  landArea: z.number().positive('Luas lahan harus lebih besar dari 0'),
  ownershipStatus: z.enum(['SHM', 'HGB', 'HAK_PAKAI', 'LAINNYA']),
  certificateNumber: z.string().min(3, 'Nomor sertifikat wajib diisi'),
  certificateOwner: z.string().min(3, 'Nama pemilik sertifikat wajib diisi'),
});

export const coordinateSchema = z.object({
  polygon: z.any().optional(), // For drawn coordinates
  coordinatesText: z.string().optional(), // For manual input
});

export const spatialSchema = z.object({
  kkprNumber: z.string().min(3, 'Nomor KKPR wajib diisi'),
  landUse: z.string().min(3, 'Peruntukan lahan wajib diisi'),
  greenArea: z.number().min(0, 'Luas PSU/RTH tidak boleh negatif'),
});

export const technicalSchema = z.object({
  lotCount: z.number().positive('Jumlah kavling minimal 1'),
  unitArea: z.number().positive('Luas unit rata-rata minimal 1'),
  roadPlan: z.string().min(3, 'Rencana jalan wajib diisi'),
  drainagePlan: z.string().min(3, 'Rencana drainase wajib diisi'),
});

export const consultantSchema = z.object({
  consultantName: z.string().min(3, 'Nama konsultan wajib diisi'),
  companyName: z.string().min(3, 'Nama perusahaan wajib diisi'),
  picName: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
});

export const documentSchema = z.object({
  legalDoc: z.any().optional(),
  technicalDoc: z.any().optional(),
  supportDoc: z.any().optional(),
});

export const photoSchema = z.object({
  photoNorth: z.any().optional(),
  photoSouth: z.any().optional(),
  photoEast: z.any().optional(),
  photoWest: z.any().optional(),
  photoAccess: z.any().optional(),
});

export const statementSchema = z.object({
  agreed: z.boolean().refine(val => val === true, {
    message: 'Anda harus mencentang pernyataan ini untuk melanjutkan'
  })
});

export const fullSubmissionSchema = z.object({
  applicant: applicantSchema,
  submission: submissionDataSchema,
  location: locationSchema,
  coordinate: coordinateSchema,
  spatial: spatialSchema,
  technical: technicalSchema,
  consultant: consultantSchema,
  document: documentSchema,
  photo: photoSchema,
  statement: statementSchema,
});

export type FullSubmissionFormValues = z.infer<typeof fullSubmissionSchema>;
