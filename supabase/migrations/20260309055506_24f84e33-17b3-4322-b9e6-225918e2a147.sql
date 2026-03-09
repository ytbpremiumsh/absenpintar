
ALTER TABLE public.school_integrations 
ADD COLUMN attendance_arrive_template text DEFAULT '📋 *Notifikasi Absensi Datang*

Ananda *{student_name}* (Kelas {class}) telah tercatat HADIR pada pukul {time}.

NIS: {student_id}
Metode: {method}

_Pesan otomatis dari Smart School Attendance System_',
ADD COLUMN attendance_depart_template text DEFAULT '📋 *Notifikasi Absensi Pulang*

Ananda *{student_name}* (Kelas {class}) telah tercatat PULANG pada pukul {time}.

NIS: {student_id}
Metode: {method}

_Pesan otomatis dari Smart School Attendance System_';
