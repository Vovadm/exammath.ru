'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { profileApi } from '@/entities/user/api/profile-api';

interface AccountSettingsProps {
  onDeleteAccount: () => void;
}

export function AccountSettings({ onDeleteAccount }: AccountSettingsProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await profileApi.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch {
      setPasswordError('Неверный текущий пароль');
    }
  };

  const handleDeleteAccount = async () => {
    await profileApi.deleteAccount();
    onDeleteAccount();
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-bold">Настройки аккаунта</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Button variant="outline" onClick={() => setShowPasswordForm((v) => !v)}>
              Сменить пароль
            </Button>
            {showPasswordForm && (
              <div className="mt-4 flex flex-col gap-2 max-w-xs">
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-green-500 text-sm">{passwordSuccess}</p>
                )}
                <Input
                  type="password"
                  placeholder="Текущий пароль"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword}>Сохранить</Button>
              </div>
            )}
          </div>

          <div>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteModal(true)}
            >
              Удалить аккаунт
            </Button>
          </div>
        </CardContent>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col gap-4 shadow-xl max-w-xs w-full">
            <p className="font-semibold text-center">
              Вы уверены, что хотите удалить аккаунт?
            </p>
            <p className="text-sm text-gray-500 text-center">
              Это действие необратимо.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Подтвердить
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
