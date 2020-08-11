

/*
SQL table structure
===========================================
Field	                Type
==========================================
jobid	               int(11)      
IMB	                   varchar(32) *PRIMARY KEY
zipPlusFour	           varchar(11)
state	               varchar(3)
package	               varchar(15)
*/
module.exports = (sequelize, DataTypes) => {
  const Imb = sequelize.define('imb', {
    jobid: {
      type: DataTypes.INTEGER,
    },
    IMB: {
      type: DataTypes.STRING,
    },
    zipPlusFour: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    package: {
      type: DataTypes.STRING,
    },
  });

  return Imb;
};
