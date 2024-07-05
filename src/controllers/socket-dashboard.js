const { Server } = require("socket.io");
const uniqid = require("uniqid");
const { badRequest, unauthorized } = require("../middleware/errors/index");
const asyncWrapper = require("../utils/asyncWrapper");
const { pool } = require("../db/db");
const medicalHistory = require("../db/models/medicalHistory");
const jsDateConverter = require("../utils/jsDateConverter");
const jwt = require("jsonwebtoken");
const { DashboardEnum } = require("../../constants");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    path: "/dashboard",
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      withCredentials: true,
    },
  });

  const rooms = [];
  const user = [];
  let admin;

  // const getMedicalHistory = async (id) => {
  //   const familyMedicalHistory = await familyMedicalHistoryModel.findOne({
  //     studentId: id,
  //   });
  //   const hospitalization = await hospitalizationModel.findOne({
  //     studentId: id,
  //   });
  //   const operation = await operationModel.findOne({
  //     studentId: id,
  //   });
  //   const trauma = await traumaModel.findOne({ studentId: id });
  //   const personalMedicalHistory = await personalMedicalHistoryModel.findOne({
  //     studentId: id,
  //   });
  //   const vitalSigns = await vitalSignsModel.findOne({
  //     studentId: id,
  //   });

  //   return {
  //     familyMedicalHistory,
  //     hospitalization,
  //     operation,
  //     trauma,
  //     personalMedicalHistory,
  //     vitalSigns,
  //   };
  // };

  // https://socket.io/docs/v4/middlewares/
  // REFERENCE FOR AUTH
  io.on("connection", async (socket) => {
    try {
      // const token = socket.handshake.auth.token;
      // temporary
      const token = socket.handshake.headers.access_token;
      console.log("someone is in");
      console.log(token);
      if (!token) {
        console.log("no credentials");
        socket.emit(
          DashboardEnum.INVALID_CREDENTIALS,
          "Credentials invalid. Please log-in first"
        );
      }

      const verify = jwt.verify(token, process.env.JWT_SECRET);

      if (verify.role === "admin") {
        if (admin) {
          socket.emit(
            DashboardEnum.ADMIN_LOGGED,
            "An admin is already logged."
          );
        } else {
          const [rows, fields] = await pool.query(
            "SELECT * FROM clinic_admin WHERE id = ?",
            [verify.id]
          );
          socket.user = rows[0];
          admin = socket;
          rooms?.forEach((element) => {
            socket.join(element);
          });
        }
      } else {
        const [rows, fields] = await pool.query(
          "SELECT * FROM clinic_user WHERE id = ?",
          [verify.id]
        );
        if (!rows[0]) {
          socket.emit(
            DashboardEnum.INVALID_CREDENTIALS,
            "Credentials invalid. Please log-in first"
          );
        } else {
          socket.user = rows[0];
          user.push(socket);
          rooms.push(rows[0].id);
          socket.join(rows[0].id);
          admin?.join(rows[0].id);
        }
      }
    } catch (error) {
      console.log("error pre");
      console.log(error);
      socket.emit(DashboardEnum.ERROR_OCCURED, {
        message: "An error occured upon logging in.",
        error,
      });
    }

    socket.on(DashboardEnum.REQUEST_HELP, async (data) => {
      try {
        const { patientID, reason } = data;
        const id = uniqid();
        const medicalHistory = patientID
          ? await medicalHistory.findOne({ studentId: patientID })
          : null;

        io.to(socket.user.id).emit(
          DashboardEnum.FILE_HELP,
          { id, medicalHistory, patientID: patientID ? patientID : 0 },
          async () => {
            await pool
              .execute(
                "INSERT INTO request_record (id, requested_by, patient_id, reason) VALUES (?, ? ,? ,?)",
                [id, socket.user.id, patientID ? patientID : 0, reason]
              )
              .then(console.log("request successful + added to database"));
          }
        );
      } catch (error) {
        console.log(error);
        socket.emit(DashboardEnum.ERROR_OCCURED, {
          message: "An error occured upon requesting help.",
          error,
        });
      }
    });

    socket.on(DashboardEnum.RESPOND_HELP, async (data) => {
      try {
        const { requestId, patientId } = data;
        io.to(socket.user.id).emit(
          DashboardEnum.INITIATE_CHAT,
          {
            message:
              "Response is on the way. Take a chat with the clinic for more details",
            medicalHistory: patientId
              ? await medicalHistory.findOne({ studentId: patientId })
              : null,
          },
          async () => {
            await pool
              .execute(
                `UPDATE request_record SET respond_time = '${jsDateConverter(
                  Date.now()
                )}' WHERE id = "${requestId}"`
              )
              .then(console.log("emit called"));
          }
        );
      } catch (error) {
        console.log(error);
        socket.emit(DashboardEnum.ERROR_OCCURED, {
          message: "An error occured upon responding help.",
          error,
        });
      }
    });

    socket.on(DashboardEnum.SEND_CHAT, async (data) => {
      try {
        const { message, senderID, receiverID } = data;
      } catch (error) {
        console.log(error);
        socket.emit(DashboardEnum.ERROR_OCCURED, {
          message: "An error occured upon sending chat.",
          error,
        });
      }
    });
  });
};
