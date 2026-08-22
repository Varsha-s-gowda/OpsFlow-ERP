import React from 'react';
import ERPLayout from '../components/ERPLayout';

export const Settings: React.FC = () => {
  const styles = {
    container: { maxWidth: 800, margin: '0 auto', padding: '20px' },
    title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20, border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: 16, fontWeight: 600, color: '#334155', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    label: { fontSize: 14, color: '#475569', fontWeight: 500 },
    desc: { fontSize: 12, color: '#64748b', marginTop: 4 },
    toggle: { width: 40, height: 24, backgroundColor: '#cbd5e1', borderRadius: 12, position: 'relative' as const, cursor: 'pointer' },
    toggleOn: { backgroundColor: '#334155' },
    knob: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', position: 'absolute' as const, top: 2, left: 2, transition: 'all 0.2s ease' },
    knobOn: { transform: 'translateX(16px)' },
  };

  return (
    <ERPLayout pageTitle="Settings">
      <div style={styles.container}>
        <h2 style={styles.title}>System Settings</h2>
        
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Notifications</div>
          <div style={styles.row}>
            <div>
              <div style={styles.label}>Email Alerts for Low Stock</div>
              <div style={styles.desc}>Receive an email when any item falls below its minimum threshold.</div>
            </div>
            <div style={{ ...styles.toggle, ...styles.toggleOn }}>
              <div style={{ ...styles.knob, ...styles.knobOn }} />
            </div>
          </div>
          <div style={styles.row}>
            <div>
              <div style={styles.label}>New Order Push Notifications</div>
              <div style={styles.desc}>Show a browser notification for new incoming customer orders.</div>
            </div>
            <div style={styles.toggle}>
              <div style={styles.knob} />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Appearance</div>
          <div style={styles.row}>
            <div>
              <div style={styles.label}>Dark Mode</div>
              <div style={styles.desc}>Toggle dark mode theme across the application.</div>
            </div>
            <div style={styles.toggle}>
              <div style={styles.knob} />
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
};