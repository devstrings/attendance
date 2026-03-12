import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import { formatDate } from '../../utils/dateUtils';

const ViewUser = () => {
  const navigate = useNavigate();
  const { userId, userType } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchUserDetails(); }, [userId, userType]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError("");
      let response;
      if (userType === "employee") {
        response = await adminService.getEmployeeDetails(userId);
      } else {
        response = await adminService.getManagerDetails(userId);
      }
      if (response.success) {
        const profile = response.data.profile;
        const userAccount = response.data.user;
        if (!profile) { setError("Profile not found"); return; }
        setUser({ ...profile, email: userAccount?.email || profile?.userId?.email || "" });
      } else {
        setError("User not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const name = user.firstName + " " + user.lastName;
    if (!window.confirm("Permanently delete " + name + "? This cannot be undone!")) return;
    try {
      const response = await adminService.deleteUser(userId, userType);
      if (response.success) {
        alert(name + " deleted!");
        navigate(userType === "employee" ? "/admin/employees" : "/admin/managers");
      }
    } catch (err) { alert(err.message || "Failed to delete."); }
  };

  if (loading) return (
    <div className="admin-container"><AdminNavbar /><div className="admin-layout"><AdminSidebar />
      <div className="admin-content" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:50,height:50,border:"4px solid #f3f4f6",borderTop:"4px solid #667eea",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}></div>
          <p style={{color:"#6b7280"}}>Loading...</p>
        </div>
      </div></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
  );

  if (error || !user) return (
    <div className="admin-container"><AdminNavbar /><div className="admin-layout"><AdminSidebar />
      <div className="admin-content" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64,marginBottom:16}}>⚠️</div>
          <h3 style={{color:"#374151",marginBottom:8}}>User Not Found</h3>
          <p style={{color:"#6b7280",marginBottom:4}}>{error || "Does not exist."}</p>
          <p style={{color:"#9ca3af",fontSize:12,marginBottom:20}}>ID: {userId} | Type: {userType}</p>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>navigate(-1)} style={{padding:"10px 24px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>← Go Back</button>
            <button onClick={fetchUserDetails} style={{padding:"10px 24px",background:"#fff",border:"2px solid #667eea",color:"#667eea",borderRadius:8,cursor:"pointer",fontWeight:600}}>🔄 Retry</button>
          </div>
        </div>
      </div></div></div>
  );

  const isEmployee = userType === "employee";
  const avatarBg = isEmployee ? "linear-gradient(135deg,#667eea,#764ba2)" : "linear-gradient(135deg,#f59e0b,#d97706)";

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={{padding:24,background:"#f9fafb",minHeight:"100vh"}}>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:700,color:"#111827",margin:0}}>{isEmployee ? "👤 Employee Details" : "👔 Manager Details"}</h1>
              <p style={{fontSize:13,color:"#6b7280",margin:"4px 0 0"}}>{user.employeeCode || "—"}</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>navigate(-1)} style={{padding:"10px 20px",background:"#fff",border:"2px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:600,color:"#374151"}}>← Back</button>
              <button onClick={()=>navigate("/admin/edit-user/"+userId+"/"+userType)} style={{padding:"10px 20px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>✏️ Edit</button>
              <button onClick={handleDelete} style={{padding:"10px 20px",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>🗑️ Delete</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,alignItems:"start"}}>

            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",textAlign:"center"}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:avatarBg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,margin:"0 auto 14px"}}>
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",margin:"0 0 4px"}}>{user.firstName} {user.lastName}</h2>
              <p style={{fontSize:13,color:"#6b7280",margin:"0 0 8px"}}>{user.designation || "—"}</p>
              <span style={{display:"inline-block",padding:"4px 14px",borderRadius:20,background:user.isActive?"#d1fae5":"#fee2e2",color:user.isActive?"#065f46":"#991b1b",fontSize:12,fontWeight:600,marginBottom:16}}>
                {user.isActive ? "● Active" : "● Inactive"}
              </span>
              <div style={{textAlign:"left",borderTop:"1px solid #f3f4f6",paddingTop:14}}>
                {[
                  {label:"Department",value:user.department},
                  {label:"Email",value:user.email},
                  {label:"Phone",value:user.phoneNumber},
                  {label:"Joining Date",value:formatDate(user.joiningDate)||"—"},
                  {label:"Employment Type",value:user.employmentType||"—"},
                ].map((item,i)=>(
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{item.label}</div>
                    <div style={{fontSize:13,color:"#111827",fontWeight:500,marginTop:2,wordBreak:"break-word"}}>{item.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:"0 0 16px",paddingBottom:10,borderBottom:"2px solid #f3f4f6"}}>📋 Personal Information</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {[
                    {label:"Full Name",value:user.firstName+" "+user.lastName},
                    {label:"CNIC",value:user.cnic||"—"},
                    {label:"Date of Birth",value:formatDate(user.dateOfBirth)||"—"},
                    {label:"Address",value:user.address||"—"},
                  ].map((item,i)=>(
                    <div key={i}>
                      <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{item.label}</div>
                      <div style={{fontSize:14,color:"#374151",marginTop:4}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:"0 0 16px",paddingBottom:10,borderBottom:"2px solid #f3f4f6"}}>💼 Work Information</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {[
                    {label:"Department",value:user.department},
                    {label:"Designation",value:user.designation},
                    {label:"Salary",value:user.salary?"PKR "+user.salary.toLocaleString():"—"},
                    {label:"Manager",value:user.managerId?(user.managerId.firstName+" "+user.managerId.lastName):"—"},
                    {label:"Shift Start",value:user.workSchedule?.shiftStartTime||"09:00"},
                    {label:"Shift End",value:user.workSchedule?.shiftEndTime||"17:00"},
                  ].map((item,i)=>(
                    <div key={i}>
                      <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{item.label}</div>
                      <div style={{fontSize:14,color:"#374151",marginTop:4}}>{item.value||"—"}</div>
                    </div>
                  ))}
                </div>
                {user.workSchedule?.workingDays && (
                  <div style={{marginTop:16}}>
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Working Days</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day=>{
                        const active = user.workSchedule.workingDays.includes(day);
                        return <span key={day} style={{padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:active?"#dbeafe":"#f3f4f6",color:active?"#1e40af":"#9ca3af"}}>{day.slice(0,3)}</span>;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {!isEmployee && user.employeesUnder?.length > 0 && (
                <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:"0 0 16px",paddingBottom:10,borderBottom:"2px solid #f3f4f6"}}>👥 Employees Under ({user.employeesUnder.length})</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {user.employeesUnder.map((emp,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#f9fafb",borderRadius:10}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:14,color:"#111827"}}>{emp.firstName} {emp.lastName}</div>
                          <div style={{fontSize:12,color:"#9ca3af"}}>{emp.employeeCode}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ViewUser;