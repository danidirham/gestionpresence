import React from 'react';
import { Card, Statistic, Row, Col, Badge, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  MailOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Message } from '../services/messageService';

const { Text } = Typography;

interface MessageStatsProps {
  messages: Message[];
}

const MessageStats: React.FC<MessageStatsProps> = ({ messages }) => {
  // Calculer les statistiques
  const totalMessages = messages.length;
  const totalSent = messages.filter(m => m.statut === 'envoye').length;
  const totalFailed = messages.filter(m => m.statut === 'echec').length;
  const totalPending = messages.filter(m => m.statut === 'en_attente').length;
  const totalScheduled = messages.filter(m => m.statut === 'programme').length;
  const totalRead = messages.filter(m => m.est_lu).length;

  const totalSMS = messages.filter(m => m.type === 'sms').length;
  const totalEmail = messages.filter(m => m.type === 'email').length;

  // Calculer les taux
  const deliveryRate = totalMessages > 0 ? (totalSent / totalMessages) * 100 : 0;
  const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

  // Style de carte pour le mode sombre
  const cardStyle = {
    backgroundColor: 'var(--card-bg-color)',
    borderColor: 'var(--card-border-color)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  // Style CSS pour les cartes en mode sombre
  const darkModeStyles = `
    :root {
      --card-bg-color: #fff;
      --card-border-color: #f0f0f0;
      --card-title-color: rgba(0, 0, 0, 0.85);
      --card-text-color: rgba(0, 0, 0, 0.65);
    }

    .dark {
      --card-bg-color: #1f2937;
      --card-border-color: #374151;
      --card-title-color: rgba(255, 255, 255, 0.85);
      --card-text-color: rgba(255, 255, 255, 0.65);
    }

    .message-stats .ant-card {
      background-color: var(--card-bg-color);
      border-color: var(--card-border-color);
    }

    .message-stats .ant-statistic-title {
      color: var(--card-title-color);
    }

    .message-stats .ant-statistic-content {
      color: var(--card-text-color);
    }

    .message-stats .ant-badge-status-text {
      color: var(--card-text-color);
    }
  `;

  return (
    <div className="message-stats">
      <style>{darkModeStyles}</style>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages totaux</span>}
              value={totalMessages}
              prefix={<SendOutlined className="dark:text-gray-300" />}
              valueStyle={{ color: 'inherit' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages envoyés</span>}
              value={totalSent}
              valueStyle={{ color: '#3f8600', className: 'dark:text-green-400' }}
              prefix={<CheckCircleOutlined className="dark:text-green-400" />}
              suffix={
                <Tooltip title="Taux de livraison">
                  <Text type="secondary" className="dark:text-gray-400">{`(${deliveryRate.toFixed(1)}%)`}</Text>
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages en échec</span>}
              value={totalFailed}
              valueStyle={{ color: '#cf1322', className: 'dark:text-red-400' }}
              prefix={<CloseCircleOutlined className="dark:text-red-400" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages programmés</span>}
              value={totalScheduled}
              valueStyle={{ color: '#1890ff', className: 'dark:text-blue-400' }}
              prefix={<ClockCircleOutlined className="dark:text-blue-400" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages en attente</span>}
              value={totalPending}
              valueStyle={{ color: '#faad14', className: 'dark:text-yellow-400' }}
              prefix={<ClockCircleOutlined className="dark:text-yellow-400" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Messages lus</span>}
              value={totalRead}
              valueStyle={{ color: '#722ed1', className: 'dark:text-purple-400' }}
              prefix={<EyeOutlined className="dark:text-purple-400" />}
              suffix={
                <Tooltip title="Taux de lecture">
                  <Text type="secondary" className="dark:text-gray-400">{`(${readRate.toFixed(1)}%)`}</Text>
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">SMS</span>}
              value={totalSMS}
              prefix={<MessageOutlined className="dark:text-gray-300" />}
              valueStyle={{ color: 'inherit' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={cardStyle} className="dark:bg-gray-800 dark:border-gray-700">
            <Statistic
              title={<span className="dark:text-gray-300">Emails</span>}
              value={totalEmail}
              prefix={<MailOutlined className="dark:text-gray-300" />}
              valueStyle={{ color: 'inherit' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: '24px' }}>
        <Text strong className="dark:text-white">Légende des statuts:</Text>
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <Badge status="success" text={<span className="dark:text-gray-300">Envoyé</span>} />
          <Badge status="error" text={<span className="dark:text-gray-300">Échec</span>} />
          <Badge status="processing" text={<span className="dark:text-gray-300">Programmé</span>} />
          <Badge status="warning" text={<span className="dark:text-gray-300">En attente</span>} />
          <Badge status="default" text={<span className="dark:text-gray-300">Brouillon</span>} />
        </div>
      </div>
    </div>
  );
};

export default MessageStats;
