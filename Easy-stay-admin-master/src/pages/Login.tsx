import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);

  async function onFinish(values: { username: string; password: string }) {
    const ok = await login(values.username, values.password);
    if (!ok) {
      message.error(error || '用户名或密码错误');
      return;
    }
    message.success('登录成功');
    const user = useAuthStore.getState().user;
    navigate(user?.role === 'admin' ? '/admin' : '/merchant');
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="易宿酒店管理后台登录" style={{ width: 420 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block>
            登录
          </Button>
          <Button type="link" onClick={() => navigate('/register')} block>
            注册账号
          </Button>
        </Form>
      </Card>
    </div>
  );
}

