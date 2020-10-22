
/*
SQL table structure
===========================================
Field	                Type
==========================================
Id                    *PRIMARY KEY
IMB	                   varchar(31) 
scanDateTime	       DATE
scanZip	               varchar(11)
mailPhase	               varchar(15)
expectedDel	           DATE
anticipatedDel	       DATE
*/
module.exports = (sequelize, DataTypes) => {
    const scan = sequelize.define('scans', {
      IMB: {
        type: DataTypes.STRING,
      },
      scanDateTime: {
        type: DataTypes.DATE,
      },
      scanZip: {
        type: DataTypes.STRING,
      },
      mailPhase: {
        type: DataTypes.STRING,
      },
      expectedDel: {
        type: DataTypes.STRING,
      },
      anticipatedDel: {
        type: DataTypes.STRING,
      },
      fileCode: {
        type: DataTypes.STRING,
      }
    },
    {
      timestamps: false
    }
  );
  
    return scan;
  };
  