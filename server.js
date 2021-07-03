if(process.env.NODE_ENV!== 'production'){
	require("dotenv").config()
}

const express = require("express");

const bodyParser = require("body-parser");

const expressLayout = require("express-ejs-layouts");
const LocalStrategy = require("passport-local").Strategy;
const passport= require("passport");
const bcrypt = require("bcryptjs");
const flash = require("express-flash");
const session = require('express-session');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressLayout);
app.use(express.static(__dirname+'/node_modules/bootstrap/dist'));
app.use(express.static(__dirname+'/images'));
app.use('/images',express.static('images'));
app.use(flash());
app.use(session({
	secret: "secret",
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.set('view engine','ejs');

var path= require('path');

const mongoose = require("mongoose");
const { Db } = require("mongodb");
const { SSL_OP_PKCS1_CHECK_2 } = require("constants");
const { features } = require("process");

mongoose.connect("mongodb+srv://mongoUser:ladkin@cluster0.7dp2k.mongodb.net/TBPDB?retryWrites=true&w=majority",{ useNewUrlParser: true,useUnifiedTopology: true});

const loginSchema = new mongoose.Schema({
	"Name" : String,
	"userName": String,
	"password": String
});

const PassCodeSchema = new mongoose.Schema({
	"PassCode" : Number,
	"Available" : Boolean
});

const Admin = mongoose.model("admin", loginSchema);
const PassCode = mongoose.model("passcode",PassCodeSchema);

var passcode = new PassCode({
	"PassCode" : 1234567,
	"Available" : true
})
passcode.save();

const collegeSchema = new mongoose.Schema({
	"INST_CODE": String,
	"INSTITUTE_NAME": String,
	"PLACE": String,
	"DIST": String,
	"COED": String,
	"OWNERSHIP": String,
	"BRANCH": String,
	"BRANCH_NAME": String,
	"OC_BOYS": Number,
	"OC_GIRLS": Number,
	"BC_A_BOYS": Number,
	"BC_A_GIRLS": Number,
	"BC_B_BOYS": Number,
	"BC_B_GIRLS": Number,
	"BC_C_BOYS": Number,
	"BC_C_GIRLS": Number,
	"BC_D_BOYS": Number,
	"BC_D_GIRLS": Number,
	"BC_E_BOYS": Number,
	"BC_E_GIRLS": Number,
	"SC_BOYS": Number,
	"SC_GIRLS": Number,
	"ST_BOYS": Number,
	"ST_GIRLS": Number,
	"TUITION_FEE": Number,
	"AFFILIATED": String
});


const College = mongoose.model("college",collegeSchema);

var college=new College({
	"INST_CODE": "AARM",
	"INSTITUTE_NAME": "AAR MAHAVEER ENGINEERING COLLEGE",
	"PLACE": "BANDLAGUDA",
	"DIST": "HYD",
	"COED": "COED",
	"OWNERSHIP": "PVT",
	"BRANCH": "CSE",
	"BRANCH_NAME": "COMPUTER SCIENCE AND ENGINEERING",
	"OC_BOYS": 25594,
	"OC_GIRLS": 30602,
	"BC_A_BOYS": 71964,
	"BC_A_GIRLS": 75760,
	"BC_B_BOYS": 55623,
	"BC_B_GIRLS": 55623,
	"BC_C_BOYS": 25594,
	"BC_C_GIRLS": 30602,
	"BC_D_BOYS": 52110,
	"BC_D_GIRLS": 52110,
	"BC_E_BOYS": 55875,
	"BC_E_GIRLS": 67605,
	"SC_BOYS": 73190,
	"SC_GIRLS": 85552,
	"ST_BOYS": 49086,
	"ST_GIRLS": 90523,
	"TUITION_FEE": 48000,
	"AFFILIATED": "JNTUH"
});

passport.use( new LocalStrategy(function (username, password, done) {
	Admin.findOne({ userName: username }, function(err,user){
		if(err) return done(err);
		if(!user) return done(null,false,{ message: 'Incorrect Username'});

		bcrypt.compare(password, user.password, function(err, res){
			if(err) return done(err);
			if(res==false) return done(null, false, { message:'Incorrect Password.'});

			return done(null,user);
		});
	});
}));
passport.serializeUser(function( user , done){
	done(null,user.id);
});
passport.deserializeUser(function(id, done){
	Admin.findById(id, function(err, user){
		done(err, user);
	});
});

function isLoggedIn(req, res, next){
	if( req.isAuthenticated()) return next(null,true);
	res.redirect('/login');
}
function isLoggedOut(req, res, next){
	if( !req.isAuthenticated()) return next();
	res.redirect('/');
}

app.get('/', function(req,res){
	res.render("show",{title:'Home Page'});
});

app.get("/login",isLoggedOut,function(request,response){
	response.render('login' , {title : 'Login Page'});
});

app.post("/login", passport.authenticate('local',{failureRedirect: '/login',failureFlash:'wrong login'}), function(req,res) {
	users=req.body.username;
	req.session.message = null;
	res.redirect("/home");
});

app.get("/logout", function(req,res){
	req.logOut();
	res.redirect("/login");
})
app.post("/",function(req,res){
	const user= req.body.userButton;
	const admin=req.body.adminButton;
	const isLoggedIn = req.isAuthenticated()
	if(admin=='admin' && !isLoggedIn)
		res.redirect('/login');
	else if(admin=='admin' && isLoggedIn)
		res.redirect('/home');
	else
		res.redirect('/home?isLoggedIn=false');
});
app.get("/home",function(req,res){
	const isLoggedIn=req.isAuthenticated();
	if(isLoggedIn){
		res.render("home",{title:'Welcome Page',name: req.user.userName,isLoggedin: isLoggedIn})
	}
	else{
	console.log(req.body);
	res.render("home",{title: "Welcome Page",name: "User",isLoggedin: isLoggedIn});}
})
app.post("/home", function(req,res){
	if(req.body.clgName){
		var query = {};
		query["INSTITUTE_NAME"] = req.body.clgName;
		College.find(query).exec(function(err,result){
			if(err){
				console.log(err);
			}else{
				req.session.display = result;
				res.redirect("/display");
			}
		})
	}
	else{
	var rank = req.body.rank;
	var gender = req.body.gender;
	var category = req.body.category;
	var x;
	if(gender=="male")
		x = category+"_BOYS";
	else	
		x = category+"_GIRLS";
	var query = {};
	rank = parseInt(rank);
	query[x] = {$gte:rank};
	req.session.x = x;
	req.session.rank = rank;
	College.find(query).sort(x).exec(function(err,result){
		if(err){
			console.log(err);
		} else{
			req.session.colleges1 = result;
			res.redirect("/College");
		}
	})}
})

app.get("/College", function(req,res){
	const isLoggedIn=req.isAuthenticated();
	res.render("College",{title: "College Page",admin: req.session.colleges1,x: req.session.x,rank:req.session.rank,isLogged: isLoggedIn});
})

app.post("/College", function(req,res){

	if(req.body.INST_CODE){
		var query = {};
		query["INST_CODE"]=req.body.INST_CODE;
		query["BRANCH"]=req.body.Branch;
		College.find(query).exec(function(err,result){
			if(err){
				console.log(err);
			}else{
				req.session.display = result;
				res.redirect("/display");
			}
		});
	}
	else{
		function fees(fee){
			if(z.includes('0'))
				return true;
			if(z.includes('1') && fee*4<=100000){
				return true
			}
			else if(z.includes('3') && (fee*4)<=300000 && (fee*4)>100000)
				return true
			else if(z.includes('5') && (fee*4)<=500000 && (fee*4)>300000)
				return true
			else if(z.includes('6') && (fee*4)>500000)
				return true
			else
				return false;
		}
		function check(clg){
			if(x.includes(clg.OWNERSHIP) && y.includes(clg.DIST) && branch.includes(clg.BRANCH) && fees(clg.TUITION_FEE) && a.includes(clg.COED)){
				return clg;
			}
		}
		z='0';
		if(req.body.TotalFee)
			z=req.body.TotalFee;
		x=[ "GOV", "PVT", "SF", "UNIV" ];
		y=[
			"HYD",
			"JTL",
			"KGM",
			"KHM",
			"KMR",
			"KRM",
			"MBN",
			"MDL",
			"MED",
			"NLG",
			"NZB",
			"PDL",
			"RR",
			"SDP",
			"SRD",
			"SRP",
			"WGR",
			"WGU",
			"YBG"
		];
		branch=[
			"ANE",
			"AGR",
			"AI",
			"AUT",
			"BME",
			"BIO",
			"MMS",
			"MTE",
			"CHE",
			"CIV",
			"CME",
			"CSN",
			"CSB",
			"CSE",
			"CSI",
			"DRG",
			"DTD",
			"EEE",
			"ECE",
			"ECM",
			"EIE",
			"ETM",
			"ECI",
			"FSP",
			"FPT",
			"FDS",
			"IPE",
			"INF",
			"ITE",
			"MCT",
			"MEC",
			"MET",
			"MMT",
			"MIN",
			"PHD",
			"PHE",
			"PLG",
			"TEX"
		]
		a=['COED','GIRLS']
		if(req.body.coed){
			if(req.body.coed=='COED')
				a=['COED']
			else if(req.body.coed=='GIRLS')
				a=['GIRLS']
		}
		if(req.body.Ownership){
			x=req.body.Ownership;
		}
		if(req.body.Location){
			y=req.body.Location;
		}
		if(req.body.Branch){
			branch = req.body.Branch;
		}
		req.session.colleges = req.session.colleges1.filter(check);
		const isLoggedIn = req.isAuthenticated();
		res.render("College",{title: "College Page",admin: req.session.colleges,x: req.session.x,rank: req.session.rank,isLogged: isLoggedIn});
	}
})
app.get("/display",function(req,res){
	res.render("Display",{title:'College',admin: req.session.display});
})
app.get("/hobbies",function(req,res){
	const isLoggedIn=req.isAuthenticated()
	res.render("hobbies",{title:'Hobbies Page',name: 'shiva',isLoggedIn: isLoggedIn});
});
app.post("/hobbies",function(req, res){
	var name = req.body.UserName;
	var pass= req.body.password;
	var name2=name.split('@');
	console.log(req.user);
	console.log(name);
	console.log(pass);
	Admin.exists({ "userName" : name , "password" : pass}, function(err,result){
		if(err){
			res.send(err);
		}else{
			if(result==true){
				res.render('hobbies' , {title : "Hobbies Page", name: name2[0]});
			}
			else
				res.redirect('/');
		}
	});
});

app.get("/register" , function(req,res){
	res.render('register',{title: 'Register Page',message: req.session.message});
});

app.post("/register" , async function(req,res){
	try{
		if(req.body.passcode){
			var passcode = parseInt(req.body.passcode);
			console.log(passcode);
			PassCode.exists({"PassCode": passcode,"Available": true},async function(err,resu){
				if(err){
					console.log(err);
				}else{
					if(resu==true){
						const hashedPassword =await bcrypt.hash(req.body.password,10)
						Admin.exists({"userName" : req.body.username} , function(err,result){
							if(err){
								console.log(err);
							}else{
								if(result==true){
									req.session.message = "UserName Already exists";
									res.redirect('/register');
								}else{
										Admin.create({Name : req.body.name,userName: req.body.username, password: hashedPassword}, function(err,result){
										if(err) console.log(err);
										console.log(result);
										res.redirect('/login');
									});
								}
							}
						});
					}else{
						req.session.message = "Wrong Passcode";
						res.redirect("/register");
					}
				}
			})
		}
	}catch(e){
		console.log(e);
		res.redirect('/register');
	}
})
app.get("/about",function(req,res){
	res.send("Hello I am shiva kumar");
});
app.get("/add" , function(req,res){
	res.render('add',{title: 'Add College'});
});
app.post("/add", function(req,res){
	console.log(req.body);
	College.create({INST_CODE : req.body.INST_CODE,INSTITUTE_NAME : req.body.INSTITUTE_NAME,PLACE : req.body.PLACE,DIST : req.body.DIST,BRANCH : req.body.BRANCH,BRANCH_NAME : req.body.BRANCH_NAME,COED : req.body.COED,OC_BOYS : req.body.OC_BOYS,OC_GIRLS : req.body.OC_GIRLS,BC_A_BOYS : req.body.BC_A_BOYS,BC_A_GIRLS : req.body.BC_A_GIRLS,BC_B_BOYS : req.body.BC_B_BOYS,BC_B_GIRLS : req.body.BC_B_GIRLS,BC_C_BOYS : req.body.BC_C_BOYS,BC_C_GIRLS : req.body.BC_C_GIRLS,BC_D_BOYS : req.body.BC_D_BOYS,BC_D_GIRLS : req.body.BC_D_GIRLS,BC_E_BOYS : req.body.BC_E_BOYS,BC_E_GIRLS : req.body.BC_E_GIRLS,SC_BOYS : req.body.SC_BOYS,SC_GIRLS : req.body.SC_GIRLS,ST_BOYS : req.body.ST_BOYS,ST_GIRLS : req.body.ST_GIRLS,TUITION_FEE : req.body.TUITION_FEE,AFFILIATED : req.body.AFFILIATED,INST_PIC : req.body.INST_PIC},function(err,result){
		if(err)
			console.log(err);
		else{
			res.redirect("/home");
		}
	});
	res.redirect("/add");
});
app.get("/update" , function(req,res){
	console.log(req.body);
	res.render('update',{title: 'Update College'});
});
app.post("/update", function(req,res){
	console.log(req.body);
	var obj = JSON.parse(req.body.query);
	console.log(obj);
	College.updateMany({"INST_CODE":req.body.INST_CODE},{$set : obj});
	res.redirect("/home");
})
app.get("/delete" , function(req,res){
	res.render('delete',{title: 'Delete College'});
});
app.post("/delete", function(req,res){
	console.log(req.body);
	res.redirect("/home");
})
app.listen(process.env.PORT || 3000 , function(){
console.log("server started on 3000");});