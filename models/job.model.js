/*
SQL table structure
===========================================
Field	                Type
==========================================
jobid	               int(11)   *PRIMARY KEY 
jobName	             varchar(50) 
mailDate	           date
*/

module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define('job', {
    jobName: {
      type: DataTypes.STRING,
    },
    mailDate: {
      type: DataTypes.STRING,
    },
  });

  return Job;
};
