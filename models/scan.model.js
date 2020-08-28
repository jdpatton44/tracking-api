
/*
SQL table structure
===========================================
Field	                Type
==========================================
Id                    *PRIMARY KEY
Imb	                   varchar(31) 
scanDateTime	       DATE
scanZip	               varchar(11)
phase	               varchar(15)
expectedDel	           DATE
anticipatedDel	       DATE
*/
module.exports = (sequelize, DataTypes) => {
    const scan = sequelize.define('scans', {
      Imb: {
        type: DataTypes.STRING,
      },
      scanDateTime: {
        type: DataTypes.DATE,
      },
      scanZip: {
        type: DataTypes.STRING,
      },
      phase: {
        type: DataTypes.STRING,
      },
      expectedDel: {
        type: DataTypes.DATE,
      },
      anticipatedDel: {
        type: DataTypes.DATE,
      },
    });
  
    return scan;
  };
  