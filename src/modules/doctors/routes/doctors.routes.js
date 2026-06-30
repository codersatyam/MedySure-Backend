const { Router } = require('express');
const validate = require('../../../middlewares/validate.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { createImageUpload } = require('../../../middlewares/upload.middleware');
const {
  createDoctorSchema,
  updateDoctorSchema,
  doctorIdParamSchema,
} = require('../validators/doctors.validator');
const { MAX_PHOTO_BYTES, ALLOWED_PHOTO_MIME } = require('../constants/doctors.constants');

const createDoctorsRoutes = ({ doctorsController, authMiddleware }) => {
  const router = Router();

  // All doctor routes require an authenticated, org-scoped user.
  router.use(authMiddleware);

  /**
   * @openapi
   * /doctors:
   *   post:
   *     tags: [Doctors]
   *     summary: Add a new doctor to the caller's organization
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [firstName, lastName]
   *             properties:
   *               firstName: { type: string, maxLength: 100, example: Asha }
   *               lastName: { type: string, maxLength: 100, example: Verma }
   *               email: { type: string, format: email, example: asha@clinic.com }
   *               phone: { type: string, example: '+919876543210' }
   *               specialization: { type: string, example: Cardiology }
   *               qualification:
   *                 type: array
   *                 items: { type: string }
   *                 example: ['MBBS', 'MD']
   *               age: { type: integer, example: 42 }
   *               photoUrl: { type: string, format: uri }
   *               totalExperience: { type: number, example: 12.5 }
   *               consultingFees: { type: number, example: 800 }
   *               licenseNumber: { type: string, example: 'MH-12345' }
   *     responses:
   *       201:
   *         description: Doctor created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/Doctor' }
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Missing required permissions
   */
  router.post('/', authorize('staff:write'), validate(createDoctorSchema), doctorsController.create);

  /**
   * @openapi
   * /doctors:
   *   get:
   *     tags: [Doctors]
   *     summary: List all doctors in the caller's organization
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of doctors.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items: { $ref: '#/components/schemas/Doctor' }
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Missing required permissions
   */
  router.get('/', authorize('staff:read'), doctorsController.list);

  /**
   * @openapi
   * /doctors/{id}:
   *   patch:
   *     tags: [Doctors]
   *     summary: Update a doctor's details (partial)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       description: Any subset of editable fields (at least one).
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             minProperties: 1
   *             properties:
   *               firstName: { type: string }
   *               lastName: { type: string }
   *               email: { type: string, format: email }
   *               phone: { type: string }
   *               specialization: { type: string }
   *               qualification: { type: array, items: { type: string } }
   *               age: { type: integer }
   *               photoUrl: { type: string, format: uri }
   *               totalExperience: { type: number }
   *               consultingFees: { type: number }
   *               licenseNumber: { type: string }
   *               isActive: { type: boolean }
   *     responses:
   *       200:
   *         description: Updated doctor.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/Doctor' }
   *       400: { description: Validation error }
   *       401: { description: Authentication required }
   *       403: { description: Missing required permissions }
   *       404: { description: Doctor not found }
   */
  router.patch(
    '/:id',
    authorize('staff:write'),
    validate(doctorIdParamSchema, 'params'),
    validate(updateDoctorSchema),
    doctorsController.update
  );

  /**
   * @openapi
   * /doctors/{id}/photo:
   *   post:
   *     tags: [Doctors]
   *     summary: Upload a doctor's profile photo (max 2MB; jpeg/png/webp)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [photo]
   *             properties:
   *               photo:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Photo uploaded; photo_url updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     id: { type: string, format: uuid }
   *                     photoUrl: { type: string, format: uri }
   *       400: { description: Missing file, too large (>2MB), or unsupported type }
   *       401: { description: Authentication required }
   *       403: { description: Missing required permissions }
   *       404: { description: Doctor not found }
   */
  router.post(
    '/:id/photo',
    authorize('staff:write'),
    validate(doctorIdParamSchema, 'params'),
    createImageUpload({
      field: 'photo',
      maxBytes: MAX_PHOTO_BYTES,
      allowedMimes: Object.keys(ALLOWED_PHOTO_MIME),
    }),
    doctorsController.uploadPhoto
  );

  return router;
};

module.exports = createDoctorsRoutes;
