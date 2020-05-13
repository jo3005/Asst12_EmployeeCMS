const inquirer = require("inquirer");
const mysql=require("mysql");
const console=require("console");
const queries = require("./lib/cmsFunctions.js");


//setup global variables for the contents of lists used in the inquirer user interface
let dept_list=[];
let dept_ids=[];
let manager_list=[];
let manager_ids=[];
let roles_list=[];
let roles_ids=[];


//create a connection
const con=mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: '',
    database: 'cms'
});

con.connect(function(err){
    if (err) {
        console.error(err);
        return ;
    }
    //successful connection
    
    //console.log("Success!");

    //Start the program
    start_cms(con);
});


//This asks the user what he/she wants to do
function getQueryType(){
    inquirer.prompt([
        {
          type: "list",
          name: "querytype",
          message: "Which type of query do you want to run?",
          choices: [
            "1. Add data to the CMS",
            "2. View data in the CMS",
            "3. Update employee roles",
            // "4. Update an employee's manager", //Not yet defined
            "5. View employees by manager",
            //"6. Delete data", //Not yet defined
            "7. View the total utilized budget of a department", 
            "8. Exit"
          ]
        } 
      ]).then(response => {
        let action = response.querytype.substring(0,1);  
        let qry_text='';
        //console.log(action);
        switch(action) {
            case "1":
                getTable('add');
                return ;

            case "2":
                getTableToShow();
                return ;

            case "3":
                getInputsForEditEmployee();
                return ;

            case "4":
                //Not yet implemented - Update an employee's manager
                //Similar to case 3 but change different data
                return ;    
            
            case "5":
                getEmpsByManager(con);
                return ;
    
            case "6":
                //Not yet implemented
                //Delete data from one of the tables
                //getTable('delete');
            
                return ;
    
            case "7":
                getSalaries(con);            
            return;

            case "8":
                //Close the connection and quit the program.
                con.end(response=>{
                    console.log("Bye!")
                })
                return;
            default:
                return ;
        }
    });  
};


// Get the information required to add a new employee
function getInputsForAddEmployee(){
    inquirer.prompt([
        {
            type: "input",
            message: "What is the new employees first name?",
            name: "emp_firstname"
        },
        {
            type: "input",
            message: "What is new employee's surname?",
            name: "emp_surname"
        },
        {
            type: "list",
            message: "What is the employee's department?",
            name: "emp_dept",
            choices: dept_list
        },
        {
            type: "list",
            message: "What is the employee's role?",
            name: "emp_role",
            choices: roles_list
        },
        {
            type: "list",
            message: "Who is the employee's manager?",
            name: "emp_manager",
            choices: manager_list
        }
    ]).then(employeeData => {
       //Work out what ids relate to the text that was selected
        const roleid=roles_ids[roles_list.indexOf(employeeData.emp_role)];
        const managerid=manager_ids[manager_list.indexOf(employeeData.emp_manager)];
        
        queries.addEmployee(con,employeeData.emp_firstname, employeeData.emp_surname,roleid,managerid)
        .then(response=> {
            //Refreshing lists with new data;
            if(employeeData.emp_role.includes('Manager')){
                async function refreshTables(con){
                    return new Promise((resolve,reject) => {
                        queries.getManagers(con)
                            .then(managers => {
                                manager_list=managers.names;
                                manager_ids=managers.ids;
                            });
                        queries.getRoles(con)
                            .then(roles => {
                                console.log("roles updated");
                                roles_list = roles.title;
                                roles_ids=roles.ids;
                            });
                        resolve(1);
                    });
                };    
                // update tables with new data   
                refreshTables(con).then(res => {
                    //Go back to the start");
                    getQueryType();    
                })
            } else {
                getQueryType();  
            }        
        })

    })

}
//Get data required to add a new department
function getInputsForAddDept(departments,roles,managers){
    inquirer.prompt([
        {
            type: "input",
            message: "What is the new department name?",
            name: "dept_firstname"
        }
    ]).then(dept => {
        queries.addDept(con,dept.dept_firstname)
        .then(response=> {
            //Refresh department lists
            async function refreshTables(con){
                return new Promise((resolve,reject) => {
                    //console.log('in the refresh function');
                    queries.getDepartments(con)
                        .then(data => {
                            //console.log("managers updated");
                            dept_list=data.names;
                            dept_ids=data.ids;
                        //console.log(managers);
                        });
                    
                    resolve(1);
                });
            };    
            // update tables with new data   
            refreshTables(con).then(res => {
                //Go back to the start
                getQueryType(dept_list,roles_list,manager_list);    
            });
          
        })

    })

};

//Get data required to add a new role
function getInputsForAddRoles(){

    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the new role?",
            name: "role_title"
        },
        {
            type: "input",
            message: "What is the salary of the new role?",
            name: "role_salary"
        },
        {
            type: "list",
            message: "What department does the new role belong to?",
            name: "role_dept",
            choices: dept_list
        }

    ]).then(role => {
        const deptid=dept_ids[dept_list.indexOf(role.role_dept)];
        
        queries.addRole(con, role.role_title,role.role_salary,deptid)
        .then(response=> {
            //console.log("refreshing datatables");
            async function refreshTables(con){
                return new Promise((resolve,reject) => {
                    //console.log('in the refresh function');
                    queries.getRoles(con)
                        .then(data => {
                            //console.log("managers updated");
                            role_list=data.names;
                            role_ids=data.ids;
                        //console.log(managers);
                        });
                    
                    resolve(1);
                });
            };    
                // update tables with new data   
            refreshTables(con).then(res => {
                //console.log("going back to the start");
                getQueryType(dept_list,roles_list,manager_list);    
            });
        })
    })
}


//Get the table that is going to have data that is added or changed
function getTable(which_task='add'){
    inquirer.prompt([
        {
            type: "list",
            message: "What data do you want to add or edit:",
            name: "what_data",
            choices: ['Departments','Roles','Employees']     
        }
    ]).then(response => {
        
        switch(response.what_data){
            case "Departments":
                if (which_task==='add') getInputsForAddDept()
                else if (which_task='edit') console.log('edit')
                else if (which_task='delete') console.log('delete');
                return 'department';
            case "Roles":
                if (which_task==='add') getInputsForAddRoles()
                else if (which_task='edit') console.log('edit')
                else if (which_task='delete') console.log('delete');
                return 'role';
            case "Employees":
                if (which_task==='add') getInputsForAddEmployee()
                else if (which_task='edit') console.log('edit')
                else if (which_task='delete') console.log('delete');
                return 'employee';
            default:
                return;
        }
    }).then(response=> {
        //console.log(response);
    })
}
function getTableToShow(){
    let data={};
    inquirer.prompt([
        {
            type: "list",
            message: "What data do you want to view:",
            name: "what_data",
            choices: ['Departments','Roles','Employees']     
        }
    ]).then(response => {
        //console.log(response.what_data);
        switch(response.what_data){
            case "Departments":
                
                queries.showDepts(con).then(data=>{
                    console.log("\r\n");
                    console.table(data);
                    console.log("\r\n");  
                });
                return 'department';
            case "Roles":
                queries.showRoles(con).then(data => {
                    console.log("\r\n");
                    console.table(data);
                    console.log("\r\n");
                });
                return 'role';
            case "Employees":
                queries.getAllEmployeeData(con).then(data => {
                    //console.log(data);
                    console.log("\r\n");
                    console.table(data);
                    console.log("\r\n");
                })
                return 'employee';
            default:
                return;
        }
    }).then(response=> {
        //console.log(response);
        getQueryType(); 
    })
}


function getSalaries(con){
    queries.getSalariesTotal(con).then(data=>{
        console.log("\r\n")
        console.table('Salaries by Department', data);
        console.log("\r\n")
    });
    getQueryType();
}

function getEmpsByManager(con){
    queries.viewEmployeesByManager(con).then(data=>{
        console.table(data);
    });
    getQueryType();
}

function getInputsForEditEmployee(conn){

    let empID=0;
    let oldroleID=0;

    queries.getAllEmployeeData(con)
    .then(response=>{
        const employees=response.map(emp=>{
            return {firstname: emp.first_name,
                    surname: emp.last_name,
                    jobtitle: emp.title
                   };
        });
        return employees;
        

    }).then(employees=>{
        inquirer.prompt([
            {
                type: "list",
                message: "Whose role do you want to change?",
                name: "what_person",
                choices: employees.map(function (emp,index) {
                    return `${index+1}. ${emp.firstname} ${emp.surname} : ${emp.jobtitle}`
                })    
            },
            {
                type: "list",
                message: "What is their new role?",
                name: "new_role",
                choices: roles_list
            }
        ]).then(response => {
            
            const regex=/[^\w\s]/;
            const strlength=response.what_person.search(regex);
            const arrayIndex=response.what_person.substring(0,strlength)-1;
            //const stringex=`${employees[arrayIndex].firstname},${employees[arrayIndex].surname},${employees[arrayIndex].jobtitle}`

            //console.log(stringex);

            queries.getEmpIndex(con,employees[arrayIndex].firstname,employees[arrayIndex].surname,employees[arrayIndex].jobtitle)
            .then(res=>{
                //console.log({res});
                empID=res.empID;
                const newroleid=roles_ids[roles_list.indexOf(response.new_role)];
                console.log(newroleid);
                queries.updateEmployeeRole(con,empID,newroleid)
                .then(response=>{
                    console.log("Updated employee's role");
                    getQueryType();
                })
            });
        })
    });   
}

function start_cms(con) {
    
    //let allemps = getAllEmployeeData(conn); //call function that returns data of all employees and their data currently in the database 

    let employees=[];//call function that returns list of all employees 
    async function getTableData(con){
        
        await queries.getDepartments(con)
            .then(depts => {        
                dept_list=depts.names;
                dept_ids=depts.ids;
            });
        await queries.getManagers(con)
            .then(managers => {
                manager_list=managers.names;
                manager_ids=managers.ids;
            //console.log(managers);
        });
        await queries.getRoles(con)
            .then(roles => {
                roles_list = roles.title;
                roles_ids=roles.ids;
                //console.log(roles);
            
        });
        return;
       }

    
    getTableData(con).then(response=>{
        //console.log(dept_list,roles_list,manager_list);
        getQueryType()
    });
 
        
        
}


