import React from 'react';
import { DatePicker, TimePicker, Form, Switch, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import locale from 'antd/es/date-picker/locale/fr_FR';

const { Text } = Typography;

interface MessageSchedulerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const MessageScheduler: React.FC<MessageSchedulerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isScheduled, setIsScheduled] = React.useState(!!value);
  const [selectedDate, setSelectedDate] = React.useState<dayjs.Dayjs | null>(
    value ? dayjs(value) : null
  );
  const [selectedTime, setSelectedTime] = React.useState<dayjs.Dayjs | null>(
    value ? dayjs(value) : null
  );

  // Mettre à jour la date programmée lorsque la date ou l'heure change
  React.useEffect(() => {
    if (isScheduled && selectedDate && selectedTime) {
      const scheduledDate = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .toDate();
      onChange(scheduledDate);
    } else if (!isScheduled) {
      onChange(null);
    }
  }, [isScheduled, selectedDate, selectedTime]);

  // Mettre à jour les états locaux lorsque la valeur change
  React.useEffect(() => {
    if (value) {
      setIsScheduled(true);
      setSelectedDate(dayjs(value));
      setSelectedTime(dayjs(value));
    } else {
      setIsScheduled(false);
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [value]);

  // Gérer le changement de date
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
  };

  // Gérer le changement d'heure
  const handleTimeChange = (time: dayjs.Dayjs | null) => {
    setSelectedTime(time);
  };

  // Gérer l'activation/désactivation de la programmation
  const handleScheduleToggle = (checked: boolean) => {
    setIsScheduled(checked);
    if (!checked) {
      onChange(null);
    } else if (selectedDate && selectedTime) {
      const scheduledDate = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .toDate();
      onChange(scheduledDate);
    } else {
      // Si aucune date/heure n'est sélectionnée, utiliser la date/heure actuelle + 1 heure
      const now = dayjs().add(1, 'hour');
      setSelectedDate(now);
      setSelectedTime(now);
      onChange(now.toDate());
    }
  };

  return (
    <div className="message-scheduler">
      <Form.Item label="Programmer l'envoi">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Switch
            checked={isScheduled}
            onChange={handleScheduleToggle}
            disabled={disabled}
          />
          <Text style={{ marginLeft: '8px' }}>
            {isScheduled ? 'Message programmé' : 'Envoi immédiat'}
          </Text>
        </div>
      </Form.Item>

      {isScheduled && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item label="Date d'envoi" style={{ flex: 1 }}>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              locale={locale}
              disabledDate={(current) => {
                // Désactiver les dates passées
                return current && current < dayjs().startOf('day');
              }}
              disabled={disabled}
            />
          </Form.Item>
          <Form.Item label="Heure d'envoi" style={{ flex: 1 }}>
            <TimePicker
              value={selectedTime}
              onChange={handleTimeChange}
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={5}
              suffixIcon={<ClockCircleOutlined />}
              disabled={disabled}
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default MessageScheduler;
