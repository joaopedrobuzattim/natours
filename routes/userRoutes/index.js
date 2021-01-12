const express = require('express');
const { getAllUsers,createUser,getUser,updateUser,deleteUser, updateMe, deleteMe, getMe, uploadUserPhoto,resizeUserPhoto } = require('../../controllers/userController');
const { signup,protect, login,logout, forgotPassword, resetPassword, updatePassword, restrictTo } = require('../../controllers/authController');


const router = express.Router();

router.post('/signup',signup);
router.post('/login',login);
router.get('/logout',logout);
router.post('/forgotPassword',forgotPassword);
router.patch('/resetPassword/:token',resetPassword);

// Midlewares rodam em sequencia
// Todas as rotas apos esse middleware serão protegidas
router.use(protect)

router.patch('/updateMyPassword',updatePassword);
router.get('/me', getMe,getUser);
// Midleware for upload an image, the 'photo' parameter is the name of the field 
// in the form
router.patch('/updateMe', uploadUserPhoto , resizeUserPhoto ,updateMe);
router.delete('/deleteMe',deleteMe);

// Midlewares rodam em sequencia
// Todas as rotas apos esse middleware serão restritas aos admins
router.use(restrictTo('admin'));

router
.route('/')
.get(getAllUsers)
.post(createUser)

router
.route('/:id') 
.get(getUser)
.patch(updateUser)
.delete(deleteUser)



module.exports = router;