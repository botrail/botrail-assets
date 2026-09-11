const rad = degrees => degrees*Math.PI/180;
export const poses = {
  presentation: {shoulder_lift_joint:rad(-130),elbow_joint:rad(100),wrist_1_joint:rad(-60),wrist_2_joint:rad(-90)},
  inspection: {shoulder_lift_joint:rad(-90),elbow_joint:rad(90),wrist_1_joint:rad(-90),wrist_2_joint:rad(-90)},
  extended: {shoulder_lift_joint:rad(-90)},
};
