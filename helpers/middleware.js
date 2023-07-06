const verifyLogin = (req, res, next) => {
    if (req.session.user) {
      next()
    } else {
      res.redirect('/login')
    }
  }



  const AdminverifyLogin = (req, res, next) => {
    if (req.session.admin && req.session.admin.loggedIn) {
      next()
    } else {
      res.redirect('/admin/adminLogin')
    }
  }

  module.exports={verifyLogin,AdminverifyLogin}